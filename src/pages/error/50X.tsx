import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { Box, Button, Grid, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTranslation } from "react-i18next";


export default () => {
  const theme = useTheme();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useTranslation();

  const error500 = new URL('../../assets/images/error/500.png', import.meta.url).href;

  return (
    <>
      <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ minHeight: '90vh' }}>
        <Grid item xs={12}>
          <Box sx={{ width: { xs: 350, sm: 396 } }}>
            <img src={error500} alt="mantis" style={{ height: '100%', width: '100%' }} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Stack justifyContent="center" alignItems="center">
            <Typography align="center" variant={matchDownSM ? 'h2' : 'h1'}>
              {t('error.Internal Server Error')}
            </Typography>
            <Typography color="textSecondary" variant="body2" align="center" sx={{ width: { xs: '73%', sm: '70%' }, mt: 1 }}>
              {t('error.Server error 500. we fixing the problem. please try again at a later stage.')}
            </Typography>
            <Button component={Link} to={`${import.meta.env.BASE_URL}`} variant="contained" sx={{ textTransform: 'none', mt: 4 }}>
              {t('error.Back To Home')}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}
