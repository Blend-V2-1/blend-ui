import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Alert,
  Box,
  ButtonBase,
  CircularProgress,
  Collapse,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Typography,
  useTheme,
} from '@mui/material';
import type { NextPage } from 'next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Divider } from '../components/common/Divider';
import { OpaqueButton } from '../components/common/OpaqueButton';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { useSettings } from '../contexts';
import { useWallet } from '../contexts/wallet';
import {
  VoteConfig,
  VoteContractClient,
  VoteOptionResult,
  VoteRecord,
  VoteResults,
} from '../utils/vote';

const ZERO = BigInt(0);
const SHARE_DECIMALS = BigInt(10_000_000);
const PERCENT_DECIMALS = 10_000_000;

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
  const contractId = process.env.NEXT_PUBLIC_VOTE_CONTRACT ?? '';
  const explorerUrl = process.env.NEXT_PUBLIC_STELLAR_EXPERT_URL ?? '';

  const client = useMemo(() => {
    if (!contractId) return undefined;
    try {
      return new VoteContractClient(contractId, network);
    } catch {
      return undefined;
    }
  }, [contractId, network]);

  const [config, setConfig] = useState<VoteConfig>();
  const [results, setResults] = useState<VoteResults>();
  const [allocation, setAllocation] = useState<bigint>(ZERO);
  const [currentVote, setCurrentVote] = useState<VoteRecord | null>(null);
  const [selectedOption, setSelectedOption] = useState<number>();
  const [expandedOption, setExpandedOption] = useState<number>();
  const [votersByOption, setVotersByOption] = useState<Record<number, string[]>>({});
  const [loadingVoters, setLoadingVoters] = useState<number>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [voterError, setVoterError] = useState('');

  const loadPoll = useCallback(async () => {
    if (!client) {
      setLoading(false);
      setError('Voting is not configured for this network.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [nextConfig, nextResults] = await Promise.all([
        client.getConfig(),
        client.getResults(),
      ]);
      let nextAllocation = ZERO;
      let nextVote: VoteRecord | null = null;
      if (connected && walletAddress) {
        [nextAllocation, nextVote] = await Promise.all([
          client.getAllocation(walletAddress),
          client.getVote(walletAddress),
        ]);
      }
      setConfig(nextConfig);
      setResults(nextResults);
      setAllocation(nextAllocation);
      setCurrentVote(nextVote);
      setVotersByOption({});
      setExpandedOption(undefined);
    } catch (e: any) {
      console.error('Unable to load vote contract:', e);
      setError(e?.message ?? 'Unable to load the vote contract.');
    } finally {
      setLoading(false);
    }
  }, [client, connected, walletAddress]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  const handleVote = async () => {
    if (!client || !connected || !walletAddress || selectedOption === undefined) return;
    setSubmitting(true);
    const success = await invokeContract(client.vote(walletAddress, selectedOption));
    if (success) {
      await loadPoll();
    }
    setSubmitting(false);
  };

  const handleExpand = async (option: VoteOptionResult) => {
    if (expandedOption === option.option) {
      setExpandedOption(undefined);
      return;
    }
    setExpandedOption(option.option);
    setVoterError('');
    if (!client || votersByOption[option.option] !== undefined) return;

    setLoadingVoters(option.option);
    try {
      const voters: string[] = [];
      for (let start = 0; start < option.voterCount; start += 100) {
        voters.push(
          ...(await client.getVoters(
            option.option,
            start,
            Math.min(100, option.voterCount - start)
          ))
        );
      }

      setVotersByOption((current) => ({ ...current, [option.option]: voters }));
    } catch (e: any) {
      console.error('Unable to load option voters:', e);
      setVoterError(e?.message ?? 'Unable to load voters.');
    } finally {
      setLoadingVoters(undefined);
    }
  };

  const showResults = !connected || allocation === ZERO || currentVote !== null;

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

      {config && results && (
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
              {connected ? formatShares(allocation) : 'Connect wallet to view'}
            </Typography>
            {currentVote && (
              <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>
                You voted “{config.options[currentVote.option]}” with{' '}
                {formatShares(currentVote.shares)} LP shares.
              </Typography>
            )}
          </Section>

          {connected && allocation > ZERO && currentVote === null && (
            <Section
              width={SectionSize.FULL}
              dir="column"
              sx={{ padding: '18px', gap: '16px', alignItems: 'stretch' }}
            >
              <Typography variant="h2">{config.proposal}</Typography>
              <RadioGroup
                value={selectedOption ?? ''}
                onChange={(event) => setSelectedOption(Number(event.target.value))}
              >
                {config.options.map((option, index) => (
                  <FormControlLabel key={option} value={index} control={<Radio />} label={option} />
                ))}
              </RadioGroup>
              <OpaqueButton
                palette={theme.palette.primary}
                disabled={selectedOption === undefined || submitting}
                onClick={handleVote}
                sx={{ width: '180px' }}
              >
                {submitting ? 'Submitting…' : 'Vote'}
              </OpaqueButton>
            </Section>
          )}

          {connected && allocation === ZERO && (
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

          {showResults && (
            <Section
              width={SectionSize.FULL}
              dir="column"
              sx={{ padding: '18px', gap: '16px', alignItems: 'stretch' }}
            >
              <Box>
                <Typography variant="h2">{config.proposal}</Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {formatShares(results.totalVotedShares)} of{' '}
                  {formatShares(results.totalEligibleShares)} eligible LP shares have voted.
                </Typography>
              </Box>

              {results.options.map((option) => {
                const percent = Number(option.percentOfCast7dp) / PERCENT_DECIMALS;
                const expanded = expandedOption === option.option;
                const voters = votersByOption[option.option];
                return (
                  <Box
                    key={option.option}
                    sx={{
                      border: `1px solid ${
                        currentVote?.option === option.option
                          ? theme.palette.primary.main
                          : '#363A43'
                      }`,
                      borderRadius: '6px',
                      overflow: 'hidden',
                    }}
                  >
                    <ButtonBase
                      onClick={() => handleExpand(option)}
                      sx={{ width: '100%', display: 'block', padding: '14px', textAlign: 'left' }}
                      aria-expanded={expanded}
                    >
                      <Row sx={{ alignItems: 'center', marginBottom: '8px', gap: '12px' }}>
                        <Typography variant="h3">{option.label}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Typography variant="h3">
                            {formatPercent(option.percentOfCast7dp)}
                          </Typography>
                          <ExpandMoreIcon
                            sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                          />
                        </Box>
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
                    </ButtonBase>
                    <Collapse in={expanded}>
                      <Box sx={{ padding: '0 14px 14px' }}>
                        {loadingVoters === option.option && <CircularProgress size={20} />}
                        {voterError && expanded && <Alert severity="error">{voterError}</Alert>}
                        {voters?.length === 0 && (
                          <Typography variant="body2">No voters yet.</Typography>
                        )}
                        {voters?.map((voter) => (
                          <Box
                            key={voter}
                            component="a"
                            href={`${explorerUrl}/${
                              voter.startsWith('C') ? 'contract' : 'account'
                            }/${voter}`}
                            target="_blank"
                            rel="noreferrer"
                            sx={{
                              display: 'block',
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                              padding: '6px 0',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            <Typography variant="body2">{voter}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Section>
          )}
        </>
      )}
    </>
  );
};

export default VotePage;
