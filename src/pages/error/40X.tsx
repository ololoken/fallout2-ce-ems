import { Link } from 'react-router-dom';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default () => {
  const { t } = useTranslation();

  const error404 = new URL('../../assets/images/error/404.png', import.meta.url).href;
  const TwoCone = new URL('../../assets/images/error/TwoCone.png', import.meta.url).href;

  return (
    <>
      <Grid
        container
        spacing={10}
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: '90vh', pt: 1.5, pb: 1, overflow: 'hidden' }}
      >
        <Grid item xs={12}>
          <Stack direction="row">
            <Grid item>
              <Box sx={{ width: { xs: 250, sm: 590 }, height: { xs: 130, sm: 300 } }}>
                <img src={error404} alt="mantis" style={{ width: '100%', height: '100%' }} />
              </Box>
            </Grid>
            <Grid item sx={{ position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 60, left: -40, width: { xs: 130, sm: 390 }, height: { xs: 115, sm: 330 } }}>
                <img src={TwoCone} alt="mantis" style={{ width: '100%', height: '100%' }} />
              </Box>
            </Grid>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Stack spacing={2} justifyContent="center" alignItems="center">
            <Typography variant="h1">{t('error.Page Not Found')}</Typography>
            <Typography color="textSecondary" align="center" sx={{ width: { xs: '73%', sm: '61%' } }}>
              {t('error.The page you are looking was moved, removed, renamed, or might never exist!')}
            </Typography>
            <Button component={Link} to={`${import.meta.env.BASE_URL}`} variant="contained">
              {t('error.Back To Home')}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </>
  )
}
