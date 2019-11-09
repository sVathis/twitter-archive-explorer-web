import React from 'react';
import './StaticPresentation.scss';
import { Link } from 'react-router-dom';
import { Avatar, Container, Typography, Divider } from '@material-ui/core';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { DownloadGDPRModal } from '../shared/NoGDPR/NoGDPR';
import SETTINGS from '../../tools/Settings';
import { setPageTitle } from '../../helpers';
import APIHELPER from '../../tools/ApiHelper';
import LANG from '../../classes/Lang/Language';

const StaticPresentation: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  setPageTitle("Twitter Archive Explorer")

  const closeModal = () => {
    setOpen(false);
  };

  const openModal = () => {
    setOpen(true);
  };

  return (
    <div className="static-page">
      <header>
        <Container>
          <section>
            <Avatar className="avatar">
              <FolderOpenIcon />
            </Avatar>

            <h1>Twitter Archive Explorer</h1>
          </section>

          <section>
            {LANG.catch_phrase}
          </section>

          <section>
            {(
              SETTINGS.is_logged ?
              <Link to="/archive/" className="button-login">{LANG.explore_archive}</Link> :
              <Link to="/login/" className="button-login">{LANG.login}</Link>
            )}
          </section>
        </Container>
      </header>

      <main>
        <Container>
          <section>
            <h2>
              {LANG.whats_a_archive} ?
            </h2>

            <p>
              {LANG.whats_a_archive_p1}
              <br />
              <a href="#!" onClick={openModal} className="dl-btn">
                {LANG.how_to_download}
              </a>.
            </p>
          </section>

          <section className="feature">
            <div>
              <h3>{LANG.powerful_search}</h3>
              <p>
                {LANG.powerful_search_p1}
              </p>
            </div>

            <img alt="Search" title={LANG.powerful_search} src="/assets/start_page/search.png" />
          </section>

          <section className="feature">
            <div>
              <h3>{LANG.clean_your_account}</h3>
              <p>
                {LANG.clean_your_account_p1} <DeletedCounter /> {LANG.tweets} !
              </p>
            </div>

            <img alt="Tasks" title={LANG.clean_your_account} src="/assets/start_page/task.jpg" />
          </section>

          <section className="feature">
            <div>
              <h3>{LANG.sort_and_filter_tweets}</h3>
              <p>
                {LANG.specific_wishes}
                <br />
                {LANG.explore_sort_p1}
                <br />
                {LANG.explore_sort_p2}
              </p>
            </div>

            <img alt={LANG.sort_and_filter_tweets} title={LANG.sort_and_filter_tweets} src="/assets/start_page/sort.png" />
          </section>

          <section className="other-feature">
            <div>
              <h2>{LANG.even_more}</h2>

              <div className="container">
                <div>
                  <h5>{LANG.travel_through_time}</h5>
                  <p>
                    {LANG.travel_through_time_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.fav_deletion}</h5>
                  <p>
                    {LANG.fav_deletion_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.background_tasks}</h5>
                  <p>
                    {LANG.background_tasks_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.tweets_of_the_day}</h5>
                  <p>
                    {LANG.tweets_of_the_day_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.twitter_at_history}</h5>
                  <p>
                    {LANG.twitter_at_history_p1}
                  </p>
                </div>

                <div>
                  <h5>{LANG.open_and_private}</h5>
                  <p>
                    {LANG.open_and_private_p1} <a 
                      href="https://github.com/alkihis/archive-explorer-web"
                      rel="noopener noreferrer"
                      target="_blank"
                    >{LANG.open_source}</a>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>

      <footer>
        <Container>
          <Divider className="divider-big-margin" />
          <Copyright />
        </Container>
      </footer>

      <DownloadGDPRModal open={open} onClose={closeModal} />
    </div>
  );
}

export default StaticPresentation;

function Copyright() {
  return (
    <div className="copyright">
      <Typography variant="body2" color="textSecondary" align="center">
        {LANG.ae_made_by} <a 
          href="https://alkihis.fr/" 
          rel="noopener noreferrer" 
          target="_blank"
        >
          Alkihis
        </a> • <a 
          href="https://twitter.com/alkihis/" 
          rel="noopener noreferrer" 
          target="_blank"
          className="twitter-link"
        >
          @Alkihis
        </a>.
      </Typography>

      <div className="github-links">
        <GithubLogo url="https://github.com/alkihis/archive-explorer-node" text="Server" />

        <GithubLogo url="https://github.com/alkihis/archive-explorer-web" text="Client" />

        <GithubLogo url="https://github.com/alkihis/twitter-archive-reader" text="Archive reader" />
      </div>
    </div>
  );
}


function GithubLogo(props: { url: string, text: string }) {
  return (
    <a rel="noopener noreferrer" target="_blank" className="github-container" href={props.url}>
      <img src="/assets/github_logo.png" alt="" className="github-img" />
      <span className="github-text">{props.text}</span>
    </a>
  );
}

type DCProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

const DeletedCounter: React.FC<DCProps> = (props: DCProps) => {
  const [deleted, setDeleted] = React.useState<number>(undefined);

  if (deleted === undefined) {
    APIHELPER.request('deleted_count', { auth: false, method: 'GET' })
      .then((resp: { count: number }) => {
        setDeleted(resp.count);
      });
  }

  return (
    <span {...props}>
      {deleted !== undefined ? deleted : "•••"}
    </span>
  );
};
