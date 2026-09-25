import { Networks } from '@stellar/stellar-sdk';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { Banner } from './Banner';

const PROPOSAL_URL = 'https://github.com/blend-capital/blend-contracts-v2/discussions/64';

export const V21TestnetBanner = () => {
  const theme = useTheme();
  const isTestnet = process.env.NEXT_PUBLIC_PASSPHRASE === Networks.TESTNET;
  const voteConfigured = Boolean(
    process.env.NEXT_PUBLIC_VOTE_CONTRACTS || process.env.NEXT_PUBLIC_VOTE_CONTRACT
  );

  if (!isTestnet || !voteConfigured) return null;

  const actionSx = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minHeight: '32px',
    borderRadius: '5px',
    padding: '6px 10px',
    color: theme.palette.text.primary,
    fontSize: '0.875rem',
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  return (
    <Banner
      sx={{
        width: 'calc(100% - 12px)',
        margin: '6px',
        padding: '10px 12px',
        gap: '12px',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        backgroundColor: theme.palette.warning.opaque,
        border: `1px solid ${theme.palette.warning.main}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 520px' }}>
        <Box
          component="span"
          sx={{
            borderRadius: '4px',
            padding: '3px 7px',
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.background.default,
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          TESTNET
        </Box>
        <Typography variant="body2">
          Blend V2.1 is deployed on Stellar testnet for evaluation. Pre-incident BLND:USDC Comet V1
          LP holders can vote on V2.1 adoption and migration questions.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Box
          component="a"
          href={PROPOSAL_URL}
          target="_blank"
          rel="noreferrer"
          sx={{
            ...actionSx,
            border: `1px solid ${theme.palette.warning.main}`,
            '&:hover': { backgroundColor: theme.palette.warning.opaque },
          }}
        >
          View proposal
          <OpenInNewIcon sx={{ fontSize: '1rem' }} />
        </Box>
        <Link href="/vote" style={{ textDecoration: 'none' }}>
          <Box
            component="span"
            sx={{
              ...actionSx,
              backgroundColor: theme.palette.primary.main,
              '&:hover': { backgroundColor: theme.palette.primary.dark },
            }}
          >
            Vote
          </Box>
        </Link>
      </Box>
    </Banner>
  );
};
