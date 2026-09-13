import { Box, BoxProps, Typography } from '@mui/material';
import { usePoolMeta } from '../../hooks/api';
import { getEmissionSymbol } from '../../hooks/types';
import { Icon } from '../common/Icon';

export interface BackstopHeaderProps extends BoxProps {
  type: 'deposit' | 'q4w';
  poolId: string;
}

export const BackstopHeader: React.FC<BackstopHeaderProps> = ({ type, poolId, sx, ...props }) => {
  const { data: poolMeta } = usePoolMeta(poolId);
  const lpSymbol = `${getEmissionSymbol(poolMeta?.deployment)}-USDC LP`;
  const headerText =
    type === 'deposit' ? `Deposit ${lpSymbol}` : `Queue ${lpSymbol} for Withdrawal`;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: '5px',
        paddingLeft: '6px',
        ...sx,
      }}
      {...props}
    >
      <Icon src={`/icons/tokens/blndusdclp.svg`} alt={`blndusdclp`} />
      <Typography variant="h3" sx={{ marginLeft: '12px' }}>
        {headerText}
      </Typography>
    </Box>
  );
};
