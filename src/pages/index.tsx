import { useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { SectionBase } from '../components/common/SectionBase';
import { ToggleSlider } from '../components/common/ToggleSlider';
import { MarketsList } from '../components/markets/MarketsList';
import { useSettings } from '../contexts';
import { PoolDeployment } from '../hooks/types';

const Markets: NextPage = () => {
  const theme = useTheme();
  const { isV2Enabled, isV21Enabled, lastPool } = useSettings();

  const [deployment, setDeployment] = useState<PoolDeployment | undefined>(undefined);

  useEffect(() => {
    if ((isV2Enabled || isV21Enabled) && lastPool?.deployment) {
      setDeployment(lastPool.deployment);
    } else if (isV21Enabled) {
      setDeployment(PoolDeployment.V21);
    } else if (isV2Enabled) {
      setDeployment(PoolDeployment.V2);
    } else {
      setDeployment(PoolDeployment.V1);
    }
  }, [isV2Enabled, isV21Enabled, lastPool]);

  return (
    <>
      <Row sx={{ alignItems: 'center' }}>
        <SectionBase type="alt" sx={{ margin: '6px', padding: '6px' }}>
          Markets
        </SectionBase>
        {(isV2Enabled || isV21Enabled) && deployment !== undefined && (
          <ToggleSlider
            options={[
              { optionName: PoolDeployment.V1, palette: theme.palette.primary },
              ...(isV2Enabled
                ? [{ optionName: PoolDeployment.V2, palette: theme.palette.backstop }]
                : []),
              ...(isV21Enabled
                ? [{ optionName: PoolDeployment.V21, palette: theme.palette.positive }]
                : []),
            ]}
            selected={deployment}
            changeState={setDeployment}
            sx={{ height: '24px', width: isV21Enabled ? '140px' : '80px', marginRight: '6px' }}
          />
        )}
      </Row>
      <Divider />
      <MarketsList deployment={deployment} />
    </>
  );
};

export default Markets;
