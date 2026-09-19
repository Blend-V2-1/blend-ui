import {
  ContractErrorType,
  parseError,
  PoolClaimArgs,
  PoolContractV1,
  PositionsEstimate,
} from '@blend-capital/blend-sdk';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, SxProps, Theme, Tooltip, Typography, useTheme } from '@mui/material';
import { rpc } from '@stellar/stellar-sdk';
import { useSettings, ViewType } from '../../contexts';
import { useWallet } from '../../contexts/wallet';
import {
  useBackstop,
  useEmitterBackstop,
  useHorizonAccount,
  usePool,
  usePoolMeta,
  usePoolOracle,
  usePoolUser,
  useSimulateOperation,
} from '../../hooks/api';
import { EMISSION_SYMBOL, PoolDeployment } from '../../hooks/types';
import { toBalance, toPercentage } from '../../utils/formatter';
import { requiresTrustline } from '../../utils/horizon';
import { BLND_ASSET } from '../../utils/token_display';
import { CustomButton } from '../common/CustomButton';
import { FlameIcon } from '../common/FlameIcon';
import { Icon } from '../common/Icon';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Skeleton } from '../common/Skeleton';
import { StackedText } from '../common/StackedText';
import { BorrowCapRing } from './BorrowCapRing';

export const PositionOverview: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();
  const theme = useTheme();
  const { connected, walletAddress, poolClaim, createTrustlines, restore } = useWallet();

  const { data: poolMeta } = usePoolMeta(poolId);
  const isV21 = poolMeta?.deployment === PoolDeployment.V21;
  const { data: backstop } = useBackstop(poolMeta?.deployment, isV21);
  const { data: emitterBackstop } = useEmitterBackstop(backstop, isV21);
  const isV21MigrationPending = isV21 && backstop !== undefined && emitterBackstop !== backstop.id;
  const { data: account, refetch: refechAccount } = useHorizonAccount();
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: userPoolData, refetch: refetchPoolUser } = usePoolUser(pool);

  const { emissions, claimedTokens } =
    userPoolData && pool
      ? userPoolData.estimateEmissions(Array.from(pool.reserves.values()))
      : { emissions: 0, claimedTokens: [] };

  const poolContract = poolId ? new PoolContractV1(poolId) : undefined;
  const claimArgs: PoolClaimArgs = {
    from: walletAddress,
    reserve_token_ids: claimedTokens,
    to: walletAddress,
  };
  const sim_op = poolContract && walletAddress !== '' ? poolContract.claim(claimArgs) : '';
  const {
    data: simResult,
    isLoading,
    refetch: refetchSim,
  } = useSimulateOperation(
    sim_op,
    claimedTokens.length > 0 && sim_op !== '' && connected && !isV21MigrationPending
  );

  if (pool === undefined || userPoolData === undefined) {
    return <Skeleton />;
  }

  const emissionAsset = BLND_ASSET;
  const emissionSymbol = EMISSION_SYMBOL;
  const hasEmissionTrustline = !requiresTrustline(account, emissionAsset);
  const isRestore =
    isLoading === false && simResult !== undefined && rpc.Api.isSimulationRestore(simResult);
  const isError =
    isLoading === false && simResult !== undefined && rpc.Api.isSimulationError(simResult);

  const userEst = poolOracle
    ? PositionsEstimate.build(pool, poolOracle, userPoolData.positions)
    : undefined;
  const handleSubmitTransaction = async () => {
    if (connected && poolMeta && userPoolData) {
      if (claimedTokens.length > 0) {
        let claimArgs: PoolClaimArgs = {
          from: walletAddress,
          reserve_token_ids: claimedTokens,
          to: walletAddress,
        };
        await poolClaim(poolMeta, claimArgs, false);
        refetchPoolUser();
      }
    }
  };

  async function handleCreateTrustlineClick() {
    if (connected) {
      await createTrustlines([emissionAsset]);
      refechAccount();
    }
  }

  const handleRestore = async () => {
    if (simResult && rpc.Api.isSimulationRestore(simResult)) {
      await restore(simResult);
      refetchSim();
    }
  };

  function renderClaimButton() {
    if (isV21MigrationPending) {
      return (
        <Box sx={{ width: '100%' }}>
          <CustomButton
            disabled
            sx={{
              width: '100%',
              padding: '12px',
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
              <FlameIcon />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <StackedText
                  title="Claim Pool Emissions"
                  titleColor="inherit"
                  text={`${toBalance(emissions)} ${emissionSymbol}`}
                  textColor="inherit"
                  type="large"
                />
                <Typography variant="body2" color={theme.palette.warning.main}>
                  Pending emitter upgrade
                </Typography>
              </Box>
            </Box>
            <ArrowForwardIcon fontSize="inherit" />
          </CustomButton>
        </Box>
      );
    } else if (hasEmissionTrustline && !isRestore && !isError) {
      return (
        <CustomButton
          sx={{
            width: '100%',
            padding: '12px',
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.paper,
            '&:hover': {
              color: theme.palette.primary.main,
            },
          }}
          onClick={handleSubmitTransaction}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <FlameIcon />
            <StackedText
              title="Claim Pool Emissions"
              titleColor="inherit"
              text={`${toBalance(emissions)} ${emissionSymbol}`}
              textColor="inherit"
              type="large"
            />
          </Box>
          <ArrowForwardIcon fontSize="inherit" />
        </CustomButton>
      );
    } else {
      let disabled = false;
      let buttonText = '';
      let buttonTooltip = undefined;
      let onClick = undefined;
      if (isRestore) {
        buttonText = 'Restore Data';
        onClick = handleRestore;
      } else if (!hasEmissionTrustline) {
        buttonText = `Add ${emissionSymbol} Trustline`;
        onClick = handleCreateTrustlineClick;
      } else if (isError) {
        const claimError = parseError(simResult);
        buttonText = 'Error checking claim';
        buttonTooltip = 'Erorr while checking claim amount: ' + ContractErrorType[claimError.type];
        disabled = true;
      }
      return (
        <Tooltip
          title={buttonTooltip}
          placement="top-start"
          enterTouchDelay={0}
          enterDelay={500}
          leaveTouchDelay={3000}
        >
          <Box sx={{ width: '100%' }}>
            <CustomButton
              sx={{
                width: '100%',
                padding: '12px',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  color: theme.palette.warning.main,
                },
              }}
              disabled={disabled}
              onClick={onClick}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Box
                  sx={{
                    borderRadius: '50%',
                    backgroundColor: theme.palette.warning.opaque,
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Icon
                    alt="BLND Token Icon"
                    src="/icons/tokens/blnd-yellow.svg"
                    height="24px"
                    width="18px"
                    isCircle={false}
                  />
                </Box>
                <StackedText
                  title="Claim Pool Emissions"
                  titleColor="inherit"
                  text={buttonText}
                  textColor="inherit"
                  type="large"
                  tooltip={buttonTooltip}
                />
              </Box>
              <ArrowForwardIcon fontSize="inherit" />
            </CustomButton>
          </Box>
        </Tooltip>
      );
    }
  }

  const isRegularViewType = viewType === ViewType.REGULAR;
  const rowSX: SxProps<Theme> = isRegularViewType
    ? { padding: '0px 12px' }
    : {
        display: 'flex',
        flexDirection: 'column',
        padding: '0px 12px',
        gap: '12px',
        alignItems: 'center',
      };
  return (
    <Row sx={rowSX}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: isRegularViewType ? '50%' : '100%',
          justifyContent: isRegularViewType ? undefined : 'space-between',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            width: '110px',
          }}
        >
          <StackedText
            title="Net APY"
            titleColor="inherit"
            text={toPercentage(userEst?.netApy)}
            textColor="inherit"
            type="large"
          />
          <Icon
            src={'/icons/dashboard/net_apr.svg'}
            alt={`backstop size icon`}
            isCircle={false}
            sx={{ marginLeft: '18px' }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginLeft: isRegularViewType ? '50px' : '18px',
          }}
        >
          <StackedText
            title="Borrow Capacity"
            titleColor="inherit"
            text={`$${toBalance(userEst?.borrowCap)}`}
            textColor="inherit"
            type="large"
          />
          <BorrowCapRing borrowLimit={userEst?.borrowLimit} />
        </Box>
      </Box>
      <Box sx={{ width: isRegularViewType ? '45%' : '100%', display: 'flex' }}>
        {renderClaimButton()}
      </Box>
    </Row>
  );
};
