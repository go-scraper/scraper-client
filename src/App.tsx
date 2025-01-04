import React, { useState } from 'react';
import axios from 'axios';
import { ScrapeResponse, UrlItem } from './types';
import {
  Button,
  LinearProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Typography,
  Divider,
  Chip,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import NumbersIcon from '@mui/icons-material/Numbers';

const App: React.FC = () => {
  const [scrapeData, setScrapeData] = useState<ScrapeResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string>('');
  const [fetchingNextPage, setFetchingNextPage] = useState<boolean>(false);
  const [loadedPages, setLoadedPages] = useState<number>(0);
  const [totalInaccessibleUrls, setTotalInaccessibleUrls] = useState<number>(0);

  const fetchScrapeData = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(url);
      setScrapeData(response.data);
      setLoadedPages(1); // Reset loaded pages on new URL fetch
      setTotalInaccessibleUrls(response.data.scraped.paginated.inaccessible_urls || 0);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status; // HTTP status code
        const errorData = err.response?.data; // Response body
        setError(
          `Error: ${errorData ? errorData?.error : err.message}`
        );
      } else if (err instanceof Error) {
        setError(`An unexpected error occurred: ${err.message}`);
      } else {
        setError(`An unexpected error occurred.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      fetchScrapeData(`${process.env.REACT_APP_SCRAPER_API_BASE_URL}/scrape?url=${url}`);
    }
  };

  const loadMore = async () => {
    if (scrapeData?.pagination.next_page) {
      setFetchingNextPage(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_SCRAPER_API_BASE_URL}${scrapeData.pagination.next_page}`);
        setScrapeData((prevData) => {
          if (prevData) {
            return {
              ...prevData,
              scraped: {
                ...prevData.scraped,
                paginated: {
                  ...prevData.scraped.paginated,
                  urls: [
                    ...prevData.scraped.paginated.urls,
                    ...response.data.scraped.paginated.urls,
                  ],
                },
              },
              pagination: response.data.pagination,
            };
          }
          return prevData;
        });
        setTotalInaccessibleUrls(
          (prev) => prev + (response.data.scraped.paginated.inaccessible_urls || 0)
        );
        setLoadedPages((prev) => prev + 1);
      } catch (err) {
        setError(`Error fetching more data: [${err}]`);
      } finally {
        setFetchingNextPage(false);
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <form onSubmit={handleSubmitUrl} style={{ marginBottom: '20px' }}>
        <TextField
          label="Enter URL"
          variant="outlined"
          fullWidth
          value={url}
          onChange={(e) => setUrl(e.target.value.trim())}
        />
        <Button type="submit" variant="contained" color="primary" style={{ marginTop: 10 }}>
          Scrape
        </Button>
      </form>

      {loading && <LinearProgress style={{marginBottom:5}}/>}
      {error && <Alert severity="error">{error}</Alert>}

      {scrapeData && (
        <Grid container spacing={2} marginTop={2}>
          {/* Left Grid */}
          <Grid item xs={6} paddingRight={2}>
            <Typography variant="h6" gutterBottom>
              Page Information
            </Typography>
            <Divider orientation="horizontal" flexItem />
            <Grid container spacing={2} marginTop={3}>
              <Grid item xs={6}>
                <Typography variant="body1">HTML Version:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={scrapeData.scraped.html_version}
                  color="primary"
                  icon={<InfoIcon />}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">Title:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>{scrapeData.scraped.title}</Typography>
              </Grid>
              {Object.entries(scrapeData.scraped.headings).map(([key, value]) => (
                <React.Fragment key={key}>
                  <Grid item xs={6}>
                    <Typography variant="body1">{key.toUpperCase()} Headings:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip
                      label={value}
                      color="secondary"
                      icon={<NumbersIcon />}
                    />
                  </Grid>
                </React.Fragment>
              ))}
              <Grid item xs={6}>
                <Typography variant="body1">Contains Login Form:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Chip
                  label={scrapeData.scraped.contains_login_form ? 'Yes' : 'No'}
                  color={scrapeData.scraped.contains_login_form ? 'success' : 'default'}
                  icon={
                    scrapeData.scraped.contains_login_form ? (
                      <CheckCircleIcon />
                    ) : (
                      <CancelIcon />
                    )
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          <Divider orientation="vertical" flexItem />

          {/* Right Grid */}
          <Grid item xs={5}>
            <Typography variant="h6" gutterBottom>
              URL Insights
            </Typography>
            <Divider orientation="horizontal" flexItem />
            <Typography marginTop={3}>
              <Chip
                label={`${scrapeData.scraped.total_urls}`}
                color="primary"
              /> URLs detected with &nbsp; <Chip
              label={`${scrapeData.scraped.external_urls}`}
              color="secondary" 
            /> external URLs and &nbsp;
            <Chip
              label={`${scrapeData.scraped.internal_urls}`}
              color="success"
            /> internal URLs.
            </Typography>
            <Typography marginTop={2}>
              <Chip
                label={`${Math.min(loadedPages * scrapeData.pagination.page_size, scrapeData.scraped.total_urls)}`}
                color="warning"
              /> of&nbsp;
              <Chip
                label={`${scrapeData.scraped.total_urls}`}
                color="primary"
              />&nbsp;URL(s) accessed and &nbsp;
              <Chip
                label={`${totalInaccessibleUrls}`}
                color="error"
              /> are inaccessible.
            </Typography>
          </Grid>
        </Grid>
      )}

      {scrapeData && (
        <>
          {scrapeData.pagination.next_page && !fetchingNextPage && (
            <Button
                onClick={loadMore}
                variant="outlined"
                fullWidth
                style={{ margin: '20px 0' }}
            >
                Access next {Math.min(scrapeData.pagination.page_size, (scrapeData.scraped.total_urls - 
                  Math.min(loadedPages * scrapeData.pagination.page_size, scrapeData.scraped.total_urls)))}
                  &nbsp;of remaining {`${scrapeData.scraped.total_urls - Math.min(loadedPages * 
                  scrapeData.pagination.page_size, scrapeData.scraped.total_urls)}`} URL(s)
            </Button>
            )}
          {fetchingNextPage && <LinearProgress style={{marginTop:25}}/>}
          <TableContainer component={Paper} style={{ marginTop: 20 }}>
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell><strong>#</strong></TableCell>
                    <TableCell><strong>URL</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Error</strong></TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {(scrapeData.scraped.paginated.urls || []).map((urlItem: UrlItem, index: number) => (
                    <TableRow
                    key={index}
                    style={{
                        backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
                        transition: 'background-color 0.3s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e0f7fa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff')}
                    >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                        <a
                            href={urlItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                            textDecoration: 'none',
                            color: 'blue',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                            maxWidth: '450px',
                            }}
                            title={urlItem.url}
                        >
                            {urlItem.url.length > 150 ? `${urlItem.url.substring(0, 147)}...` : urlItem.url}
                        </a>
                    </TableCell>

                    <TableCell style={{maxWidth:100}}>
                        {urlItem.http_status >= 200 && urlItem.http_status < 300 ? (
                        <Chip label={`Success (${urlItem.http_status})`} color="success" icon={<CheckCircleIcon />} />
                        ) : (
                        <Chip label={`Error (${urlItem.http_status})`} color="error" icon={<CancelIcon />} />
                        )}
                    </TableCell>
                    <TableCell style={{maxWidth:300, wordWrap: 'break-word', whiteSpace: 'normal'}}>{urlItem.error ? <Alert severity="error">{urlItem.error}</Alert> : 'None'}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </>
      )}
    </div>
  );
};

export default App;
