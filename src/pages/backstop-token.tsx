import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { IconButton, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { BackstopExitAnvil } from '../components/backstop/BackstopExitAnvil';
import { BackstopJoinAnvil } from '../components/backstop/BackstopJoinAnvil';
import { Divider } from '../components/common/Divider';
import { GoBackButton } from '../components/common/GoBackButton';
import { Icon } from '../components/common/Icon';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { ToggleButton } from '../components/common/ToggleButton';
import { ViewType, useSettings } from '../contexts';
import { useBackstop, useHorizonAccount, useTokenBalance } from '../hooks/api';
import { getEmissionSymbol, PoolDeployment } from '../hooks/types';
import { toBalance } from '../utils/formatter';
import { BLND_ASSET, BLNT_ASSET, USDC_ASSET, V21_USDC_ASSET } from '../utils/token_display';

const BackstopToken: NextPage = () => {
  const theme = useTheme();
  const { showJoinPool, setShowJoinPool, viewType, network } = useSettings();
  const router = useRouter();
  const deployment =
    router.query.deployment === PoolDeployment.V21
      ? PoolDeployment.V21
      : router.query.deployment === PoolDeployment.V2
      ? PoolDeployment.V2
      : PoolDeployment.V1;
  const emissionAsset = deployment === PoolDeployment.V21 ? BLNT_ASSET : BLND_ASSET;
  const usdcAsset = deployment === PoolDeployment.V21 ? V21_USDC_ASSET : USDC_ASSET;
  const emissionSymbol = getEmissionSymbol(deployment);
  const lpSymbol = `${emissionSymbol}-USDC LP`;

  const BLND_CONTRACT_ID = emissionAsset.contractId(network.passphrase);
  const USDC_CONTRACT_ID = usdcAsset.contractId(network.passphrase);

  const { data: backstop } = useBackstop(deployment);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: blndBalanceRes } = useTokenBalance(BLND_CONTRACT_ID, emissionAsset, horizonAccount);
  const { data: usdcBalanceRes } = useTokenBalance(USDC_CONTRACT_ID, usdcAsset, horizonAccount);
  const { data: lpBalanceRes } = useTokenBalance(
    backstop?.backstopToken?.id ?? '',
    undefined,
    horizonAccount
  );

  const blndBalance = blndBalanceRes ?? BigInt(0);
  const usdcBalance = usdcBalanceRes ?? BigInt(0);
  const lpBalance = lpBalanceRes ?? BigInt(0);

  const handleJoinPoolClick = () => {
    if (!showJoinPool) {
      setShowJoinPool(true);
    }
  };

  const handleExitPoolClick = () => {
    if (showJoinPool) {
      setShowJoinPool(false);
    }
  };

  const title =
    viewType === ViewType.MOBILE ? lpSymbol : `80:20 ${emissionSymbol}-USDC Liquidity Pool`;

  return (
    <>
      <Row sx={{ margin: '12px', justifyContent: 'flex-start', alignItems: 'center' }}>
        <GoBackButton sx={{ backgroundColor: theme.palette.background.paper, margin: '12px' }} />
        <Icon
          src={'/icons/pageicons/blnd_usdc_pair.svg'}
          alt={`blndusdclp`}
          isCircle={false}
          height={'30px'}
          width={'45px'}
          sx={{ marginRight: '12px' }}
        />
        <Typography variant="h2">{title}</Typography>
        <IconButton
          onClick={() =>
            window.open(
              `${process.env.NEXT_PUBLIC_STELLAR_EXPERT_URL}/contract/${backstop?.config?.backstopTkn}`,
              '_blank'
            )
          }
          size="small"
          sx={{
            marginLeft: '6px',
            color: theme.palette.text.secondary,
          }}
        >
          <OpenInNewIcon fontSize="inherit" />
        </IconButton>
      </Row>
      <Divider />
      <Row>
        <Section width={SectionSize.FULL} sx={{ padding: '0px' }}>
          <ToggleButton
            active={showJoinPool}
            palette={theme.palette.backstop}
            sx={{ width: '50%', padding: '12px' }}
            onClick={handleJoinPoolClick}
          >
            Join Pool
          </ToggleButton>
          <ToggleButton
            active={!showJoinPool}
            palette={theme.palette.backstop}
            sx={{ width: '50%', padding: '12px' }}
            onClick={handleExitPoolClick}
          >
            Exit Pool
          </ToggleButton>
        </Section>
      </Row>
      {viewType !== ViewType.REGULAR && (
        <Row>
          <Section
            width={SectionSize.FULL}
            sx={{ alignItems: 'center', justifyContent: 'flex-start', padding: '12px' }}
          >
            <Icon
              src={'/icons/tokens/blndusdclp.svg'}
              alt={`lp token icon`}
              sx={{ marginRight: '12px' }}
            />
            <StackedText
              title="Your LP Balance"
              titleColor="inherit"
              text={toBalance(lpBalance, 7)}
              textColor="inherit"
              type="large"
            />
          </Section>
        </Row>
      )}
      <Row>
        {viewType === ViewType.REGULAR && (
          <Section
            width={SectionSize.THIRD}
            sx={{ alignItems: 'center', justifyContent: 'flex-start', padding: '12px' }}
          >
            <Icon
              src={'/icons/tokens/blndusdclp.svg'}
              alt={`lp token icon`}
              sx={{ marginRight: '12px' }}
            />
            <StackedText
              title="Your LP Token Balance"
              titleColor="inherit"
              text={toBalance(lpBalance, 7)}
              textColor="inherit"
              type="large"
            />
          </Section>
        )}
        <Section
          width={viewType === ViewType.REGULAR ? SectionSize.THIRD : SectionSize.TILE}
          sx={{ alignItems: 'center', justifyContent: 'flex-start', padding: '12px' }}
        >
          <Icon src={'/icons/tokens/blnd.svg'} alt={`blnd icon`} sx={{ marginRight: '12px' }} />
          <StackedText
            title={`Your ${emissionSymbol} Balance`}
            titleColor="inherit"
            text={toBalance(blndBalance, 7)}
            textColor="inherit"
            type="large"
          />
        </Section>
        <Section
          width={viewType === ViewType.REGULAR ? SectionSize.THIRD : SectionSize.TILE}
          sx={{ alignItems: 'center', justifyContent: 'flex-start', padding: '12px' }}
        >
          <Icon
            src={'https://www.centre.io/images/usdc/usdc-icon-86074d9d49.png'}
            alt={`usdc icon`}
            sx={{ marginRight: '12px' }}
          />
          <StackedText
            title="Your USDC Balance"
            titleColor="inherit"
            text={toBalance(usdcBalance, 7)}
            textColor="inherit"
            type="large"
          />
        </Section>
      </Row>

      {showJoinPool ? (
        <BackstopJoinAnvil key={deployment} deployment={deployment} />
      ) : (
        <BackstopExitAnvil key={deployment} deployment={deployment} />
      )}
    </>
  );
};

export default BackstopToken;
