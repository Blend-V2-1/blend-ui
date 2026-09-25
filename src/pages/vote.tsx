import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Typography,
  useTheme,
} from '@mui/material';
import type { NextPage } from 'next';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Divider } from '../components/common/Divider';
import { OpaqueButton } from '../components/common/OpaqueButton';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { useSettings } from '../contexts';
import { useWallet } from '../contexts/wallet';
import { VoteConfig, VoteContractClient, VoteRecord, VoteResults } from '../utils/vote';

const ZERO = BigInt(0);
const SHARE_DECIMALS = BigInt(10_000_000);
const PERCENT_DECIMALS = 10_000_000;
const VOTE_CONTRACT_IDS = (
  process.env.NEXT_PUBLIC_VOTE_CONTRACTS ||
  process.env.NEXT_PUBLIC_VOTE_CONTRACT ||
  ''
)
  .split(',')
  .map((contractId) => contractId.trim())
  .filter(
    (contractId, index, contractIds) => contractId && contractIds.indexOf(contractId) === index
  );

interface ConfiguredVoteClient {
  contractId: string;
  client: VoteContractClient;
}

interface VotePoll extends ConfiguredVoteClient {
  config: VoteConfig;
  results: VoteResults;
  allocation: bigint;
  currentVote: VoteRecord | null;
}

function formatShares(raw: bigint): string {
  const whole = raw / SHARE_DECIMALS;
  const fraction = (raw % SHARE_DECIMALS).toString().padStart(7, '0').replace(/0+$/, '');
  return `${whole.toLocaleString()}${fraction ? `.${fraction}` : ''}`;
}

function formatPercent(raw: bigint): string {
  return `${(Number(raw) / PERCENT_DECIMALS).toFixed(2)}%`;
}

const VotePage: NextPage = () => {
  const theme = useTheme();
  const { network } = useSettings();
  const { connected, walletAddress, invokeContract } = useWallet();

  const clients = useMemo(
    () =>
      VOTE_CONTRACT_IDS.map((contractId) => {
        try {
          return { contractId, client: new VoteContractClient(contractId, network) };
        } catch {
          return undefined;
        }
      }).filter((configured): configured is ConfiguredVoteClient => configured !== undefined),
    [network]
  );

  const [polls, setPolls] = useState<VotePoll[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submittingContract, setSubmittingContract] = useState<string>();
  const submissionInFlight = useRef(false);
  const [error, setError] = useState('');

  const loadPolls = useCallback(async () => {
    if (clients.length === 0) {
      setLoading(false);
      setError('Voting is not configured for this network.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const nextPolls = await Promise.all(
        clients.map(async ({ contractId, client }) => {
          const [config, results] = await Promise.all([client.getConfig(), client.getResults()]);
          let allocation = ZERO;
          let currentVote: VoteRecord | null = null;
          if (connected && walletAddress) {
            [allocation, currentVote] = await Promise.all([
              client.getAllocation(walletAddress),
              client.getVote(walletAddress),
            ]);
          }
          return { contractId, client, config, results, allocation, currentVote };
        })
      );
      setPolls(nextPolls);
    } catch (e: any) {
      console.error('Unable to load vote contracts:', e);
      setError(e?.message ?? 'Unable to load the vote contracts.');
    } finally {
      setLoading(false);
    }
  }, [clients, connected, walletAddress]);

  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  const handleVote = async (poll: VotePoll) => {
    const selectedOption = selectedOptions[poll.contractId];
    if (
      !connected ||
      !walletAddress ||
      selectedOption === undefined ||
      submissionInFlight.current
    ) {
      return;
    }

    submissionInFlight.current = true;
    setSubmittingContract(poll.contractId);
    try {
      const success = await invokeContract(poll.client.vote(walletAddress, selectedOption));
      if (success) {
        await loadPolls();
      }
    } finally {
      submissionInFlight.current = false;
      setSubmittingContract(undefined);
    }
  };

  const referencePoll = polls[0];

  if (loading) {
    return (
      <Row sx={{ justifyContent: 'center', padding: '72px' }}>
        <CircularProgress />
      </Row>
    );
  }

  return (
    <>
      <Row sx={{ margin: '12px', padding: '12px', flexDirection: 'column', gap: '6px' }}>
        <Typography variant="h1">Blend LP Vote</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          A non-binding signal weighted by pre-incident BLND:USDC Comet V1 LP shares.
        </Typography>
      </Row>
      <Divider />

      {error && (
        <Row sx={{ padding: '12px' }}>
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Row>
      )}

      {referencePoll && (
        <>
          <Section
            width={SectionSize.FULL}
            dir="column"
            sx={{ padding: '18px', gap: '8px', alignItems: 'flex-start' }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Your pre-incident LP shares
            </Typography>
            <Typography variant="h1">
              {connected ? formatShares(referencePoll.allocation) : 'Connect wallet to view'}
            </Typography>
          </Section>

          {connected && referencePoll.allocation === ZERO && (
            <Row sx={{ padding: '12px' }}>
              <Alert severity="info" sx={{ width: '100%' }}>
                This wallet has no voting weight in the pre-incident LP snapshot.
              </Alert>
            </Row>
          )}

          {!connected && (
            <Row sx={{ padding: '12px' }}>
              <Alert severity="info" sx={{ width: '100%' }}>
                Connect a wallet to check its pre-incident LP shares and voting status.
              </Alert>
            </Row>
          )}

          {polls.map((poll) => {
            const selectedOption = selectedOptions[poll.contractId];
            const submitting = submittingContract === poll.contractId;
            const submissionPending = submittingContract !== undefined;
            const showResults = !connected || poll.allocation === ZERO || poll.currentVote !== null;

            return (
              <Box key={poll.contractId}>
                {connected && poll.allocation > ZERO && poll.currentVote === null && (
                  <Section
                    width={SectionSize.FULL}
                    dir="column"
                    sx={{ padding: '18px', gap: '16px', alignItems: 'stretch' }}
                  >
                    <Typography variant="h2">{poll.config.proposal}</Typography>
                    <RadioGroup
                      value={selectedOption ?? ''}
                      onChange={(event) =>
                        setSelectedOptions((current) => ({
                          ...current,
                          [poll.contractId]: Number(event.target.value),
                        }))
                      }
                    >
                      {poll.config.options.map((option, index) => (
                        <FormControlLabel
                          key={option}
                          value={index}
                          control={<Radio />}
                          label={option}
                        />
                      ))}
                    </RadioGroup>
                    <OpaqueButton
                      palette={theme.palette.primary}
                      disabled={selectedOption === undefined || submissionPending}
                      onClick={() => handleVote(poll)}
                      sx={{ width: '180px' }}
                    >
                      {submitting ? 'Submitting…' : 'Vote'}
                    </OpaqueButton>
                  </Section>
                )}

                {showResults && (
                  <Section
                    width={SectionSize.FULL}
                    dir="column"
                    sx={{ padding: '18px', gap: '16px', alignItems: 'stretch' }}
                  >
                    <Box>
                      <Typography variant="h2">{poll.config.proposal}</Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {formatShares(poll.results.totalVotedShares)} of{' '}
                        {formatShares(poll.results.totalEligibleShares)} eligible LP shares have
                        voted.
                      </Typography>
                      {poll.currentVote && (
                        <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>
                          You voted “{poll.config.options[poll.currentVote.option]}” with{' '}
                          {formatShares(poll.currentVote.shares)} LP shares.
                        </Typography>
                      )}
                    </Box>

                    {poll.results.options.map((option) => {
                      const percent = Number(option.percentOfCast7dp) / PERCENT_DECIMALS;
                      return (
                        <Box
                          key={option.option}
                          sx={{
                            border: `1px solid ${
                              poll.currentVote?.option === option.option
                                ? theme.palette.primary.main
                                : '#363A43'
                            }`,
                            borderRadius: '6px',
                            overflow: 'hidden',
                            padding: '14px',
                          }}
                        >
                          <Row sx={{ alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
                            <Typography variant="h3">{option.label}</Typography>
                            <Typography variant="h3">
                              {formatPercent(option.percentOfCast7dp)}
                            </Typography>
                          </Row>
                          <LinearProgress
                            variant="determinate"
                            value={percent}
                            sx={{ height: '14px', borderRadius: '7px', marginBottom: '8px' }}
                          />
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                            {formatShares(option.shares)} LP shares · {option.voterCount}{' '}
                            {option.voterCount === 1 ? 'voter' : 'voters'}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Section>
                )}
              </Box>
            );
          })}
        </>
      )}
    </>
  );
};

export default VotePage;
