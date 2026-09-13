import { Box, BoxProps, Typography } from '@mui/material';
import { PoolDeploymentLike } from '../../hooks/types';
import { VersionTag } from '../common/VersionTag';
import { PoolIcon } from './PoolIcon';

export interface PoolHeaderProps extends BoxProps {
  name: string;
  poolAddress?: string;
  version: PoolDeploymentLike;
}

export const PoolHeader: React.FC<PoolHeaderProps> = ({
  name,
  poolAddress,
  version,
  sx,
  ...props
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: '5px',
        ...sx,
      }}
      {...props}
    >
      <PoolIcon
        name={name}
        poolAddress={poolAddress}
        sx={{ height: '30px', width: '30px', borderRadius: '50%' }}
      />
      <Typography variant="h3" sx={{ marginLeft: '6px' }}>
        {`${name} Pool`}
      </Typography>

      <VersionTag version={version} sx={{ marginLeft: '6px' }} />
    </Box>
  );
};
