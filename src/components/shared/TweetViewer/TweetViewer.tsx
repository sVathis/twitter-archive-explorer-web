import React from 'react';
import { PartialTweet, TwitterHelpers } from 'twitter-archive-reader';
import InfiniteScroll from 'react-infinite-scroller';
import SETTINGS, { TweetSortType, TweetSortWay, TweetMediaFilters } from '../../../tools/Settings';
import Tweet from '../Tweets/Tweet';
import classes from './TweetViewer.module.scss';
import { filterTweets } from '../../../helpers';
import NoTweetsIcon from '@material-ui/icons/FormatClear';
import { CenterComponent } from '../../../tools/PlacingComponents';
import { Typography, Button, CircularProgress, Icon, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Menu, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';
import TweetCache from '../../../classes/TweetCache';
import Tasks from '../../../tools/Tasks';
import { toast } from '../Toaster/Toaster';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import SortIcon from '@material-ui/icons/Sort';
import Hot from '@material-ui/icons/Whatshot';
import Favorite from '@material-ui/icons/Star';
import Retweet from '@material-ui/icons/Repeat';
import Time from '@material-ui/icons/Schedule';
import TweetUser from '@material-ui/icons/Person';
import All from '@material-ui/icons/AllInclusive';
import Videos from '@material-ui/icons/Videocam';
import Shuffle from '@material-ui/icons/Shuffle';
import MentionIcon from '@material-ui/icons/Reply';
import Pictures from '@material-ui/icons/Collections';
import CustomTooltip from '../CustomTooltip/CustomTooltip';
import LANG from '../../../classes/Lang/Language';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import PlusIcon from '@material-ui/icons/Add';
import MinusIcon from '@material-ui/icons/Close';
import RevertIcon from '@material-ui/icons/Refresh';
import ArrowWithEndIcon from '@material-ui/icons/PlayForWork';

export type MenuNeededDetails = { element: HTMLElement, position: { left: number, top: number } };
export type SelectedCheckboxDetails = { id: string } & MenuNeededDetails;
 
type ViewerProps = {
  tweets: PartialTweet[];
  withMoments?: boolean;
  chunkLen?: number;
};

type ViewerState = {
  chunk_len: number;
  has_more: boolean;
  tweets: PartialTweet[];
  current_page: PartialTweet[];
  scroller_key: string;
  delete_modal: boolean;
  selected: Set<string>;
  modal_confirm: boolean;
  key: string;

  /** Filters */
  sort_type: TweetSortType;
  sort_way: TweetSortWay;
  media_filter: TweetMediaFilters;
  allow_rts: boolean;
  allow_self: boolean;
  allow_mentions: boolean;

  /** Select tweets */
  selected_checkbox?: SelectedCheckboxDetails;

  /** Menu bulk delete */
  menu_bulk_delete?: MenuNeededDetails;
};

const DEFAULT_CHUNK_LEN = 26;

export default class TweetViewer extends React.Component<ViewerProps, ViewerState> {
  state: ViewerState;
  references: {
    [id: string]: React.RefObject<Tweet>
  } = {};
  cache: {
    [id: string]: any;
  } = {};

  constructor(props: ViewerProps) {
    super(props);

    // Actualise les filtres en fonction du type de l'archive
    if (!SETTINGS.archive.is_gdpr) {
      // Désactive les filters inaccessibles
      // Si jamais on est en tri vidéo seulement, réinitialise
      if (SETTINGS.media_filter === "video") {
        SETTINGS.media_filter = "none";
      }
      // Pareil pour le temps
      if (SETTINGS.sort_type !== "time") {
        SETTINGS.sort_type = "time";
      }
    }

    const tweets = filterTweets(this.props.tweets, this.props.withMoments);

    this.state = {
      chunk_len: this.props.chunkLen ? this.props.chunkLen : DEFAULT_CHUNK_LEN,
      has_more: true,
      tweets,
      current_page: [],
      scroller_key: String(Math.random()),
      delete_modal: false,
      selected: new Set(),
      modal_confirm: false,
      key: String(Math.random()),
      sort_type: SETTINGS.sort_type,
      sort_way: SETTINGS.sort_way,
      media_filter: SETTINGS.media_filter,
      allow_mentions: SETTINGS.allow_mentions,
      allow_rts: SETTINGS.allow_rts,
      allow_self: SETTINGS.allow_self
    };

    this.onTweetCheckChange = this.onTweetCheckChange.bind(this);
    this.renderTweet = this.renderTweet.bind(this);
  }

  componentDidMount() {
    // @ts-ignore
    window.addEventListener('tweet.check-one', this.onTweetSelect);
  }

  componentWillUnmount() {
    // @ts-ignore
    window.removeEventListener('tweet.check-one', this.onTweetSelect);
  }

  onTweetSelect = (e: CustomEvent<SelectedCheckboxDetails>) => {
    this.setState({
      selected_checkbox: e.detail
    });
  };

  onOpenDeleteMenuClick = (e: React.MouseEvent<HTMLElement>) => {
    this.setState({
      menu_bulk_delete: {
        position: {
          left: e.clientX + 2,
          top: e.clientY
        },
        element: e.currentTarget
      }
    });
  };

  /** FILTERS */
  handleShowModeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: string[]) => {
    if (value.length === 0) {
      return;
    }

    SETTINGS.allow_mentions = value.includes('mentions');
    SETTINGS.allow_rts = value.includes('retweets');
    SETTINGS.allow_self = value.includes('self');

    this.setState({
      allow_mentions: SETTINGS.allow_mentions,
      allow_rts: SETTINGS.allow_rts,
      allow_self: SETTINGS.allow_self,
      key: String(Math.random())
    });
  };

  handleSortTypeChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetSortType) => {
    if (!value) {
      return;
    }
    
    SETTINGS.sort_type = value;
    this.setState({
      sort_type: value,
      key: String(Math.random())
    });
  };

  handleSortWayChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetSortWay) => {
    if (!value) {
      return;
    }

    SETTINGS.sort_way = value;
    this.setState({
      sort_way: value,
      key: String(Math.random())
    });
  };

  handleMediaChange = (_: React.MouseEvent<HTMLElement, MouseEvent>, value: TweetMediaFilters) => {
    if (!value) {
      return;
    }

    SETTINGS.media_filter = value;
    this.setState({
      media_filter: value,
      key: String(Math.random())
    });
  };

  renderFilters() {
    const show_types = [];

    if (SETTINGS.allow_mentions) {
      show_types.push("mentions");
    }
    if (SETTINGS.allow_rts) {
      show_types.push("retweets");
    }
    if (SETTINGS.allow_self) {
      show_types.push("self");
    }

    return (
      <div className={classes.toggleContainer}>
        {/* Show mode (all, retweets only, tweets only, mentions) */}
        <ToggleButtonGroup
          value={show_types}
          onChange={this.handleShowModeChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="self">
            <CustomTooltip title={LANG.show_your_tweets}>
              <TweetUser />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="retweets">
            <CustomTooltip title={LANG.show_retweets}>
              <Retweet />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="mentions">
            <CustomTooltip title={LANG.show_replies}>
              <MentionIcon />
            </CustomTooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Sort mode (time, popular, retweets, favorites) */}
        <ToggleButtonGroup
          value={this.state.sort_type}
          exclusive
          onChange={this.handleSortTypeChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="time">
            <CustomTooltip title={LANG.sort_by_date}>
              <Time />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton 
            value="popular" 
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.sort_by_popular}>
              <Hot />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton 
            value="retweets" 
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.sort_by_rt_count}>
              <Retweet />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton 
            value="favorites" 
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.sort_by_fav_count}>
              <Favorite />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="random">
            <CustomTooltip title={LANG.sort_by_random}>
              <Shuffle />
            </CustomTooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Sort mode (asc desc) */}
        <ToggleButtonGroup
          value={this.state.sort_way}
          exclusive
          onChange={this.handleSortWayChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="asc">
            <CustomTooltip title={LANG.sort_asc}>
              <SortIcon style={{transform: 'rotate(180deg)'}} />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="desc">
            <CustomTooltip title={LANG.sort_desc}>
              <SortIcon />
            </CustomTooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Media mode (with pic, with video...) */}
        <ToggleButtonGroup
          value={this.state.media_filter}
          exclusive
          onChange={this.handleMediaChange}
          className={classes.inlineToggleButton}
        >
          <ToggleButton value="none">
            <CustomTooltip title={LANG.show_all_tweets}>
              <All />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton value="pic">
            <CustomTooltip title={LANG.show_with_medias}>
              <Pictures />
            </CustomTooltip>
          </ToggleButton>

          <ToggleButton 
            value="video" 
            disabled={!SETTINGS.archive.is_gdpr}
          >
            <CustomTooltip title={LANG.show_with_videos}>
              <Videos />
            </CustomTooltip>
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    );
  }

  /** MODAL */
  openConfirmModal() {
    this.setState({ modal_confirm: true });
  }

  closeConfirmModal() {
    this.setState({ modal_confirm: false });
  }

  closeSelectedCheckbox = () => {
    this.setState({ selected_checkbox: undefined });
  };

  closeDeleteMenu = () => {
    this.setState({ menu_bulk_delete: undefined });
  };

  /** GET TWEETS */
  loadTweets(page: number) {
    page -= 1;

    const start = this.state.chunk_len * page;

    const tweets = this.state.tweets.slice(start, start + this.state.chunk_len);

    if (!tweets.length) {
      const current_page = this.state.current_page;
      this.setState({
        current_page,
        has_more: false
      });
      return;
    }

    if (SETTINGS.tweet_dl && !SETTINGS.expired) {
      // do dl
      TweetCache.bulk(tweets.map(t => t.id_str))
        .then(data => {
          const t = tweets.map(t => data[t.id_str]).filter(t => t);
          // console.log(t, "excepted", tweets.length);
    
          // @ts-ignore
          this.state.current_page.push(...t);
        })
        .catch(e => {
          // show error
          console.error(e);
          // Classic load instead
          this.state.current_page.push(...tweets);
        })
        .finally(() => {
          const current_page = this.state.current_page;
          this.setState({
            current_page,
            has_more: tweets.length > 0
          });
        })
    }
    else if (SETTINGS.archive.is_gdpr && SETTINGS.rt_dl && !SETTINGS.expired) {
      TweetCache.bulkRts(tweets)
        .then(tweets => {
          this.state.current_page.push(...tweets);
          const current_page = this.state.current_page;

          this.setState({
            current_page,
            has_more: tweets.length > 0
          });
        }); 
    }
    else {
      this.state.current_page.push(...tweets);

      const current_page = this.state.current_page;
      this.setState({
        current_page,
        has_more: tweets.length > 0
      });
    }
  }

  /** REFRESH COMPONENT */
  componentDidUpdate(prev_props: ViewerProps, prev_state: ViewerState) {
    if (
      prev_props.tweets !== this.props.tweets || 
      prev_state.key !== this.state.key || 
      this.props.withMoments !== prev_props.withMoments
    ) {
      // Tweets change, component reset
      this.references = {};
      this.cache = {};
      const tweets = filterTweets(this.props.tweets, this.props.withMoments);
      this.setState({
        current_page: [],
        tweets,
        has_more: true,
        delete_modal: false,
        scroller_key: String(Math.random()),
        selected: new Set(),
      });
    }
  }

  /** METHODS FOR TWEETS */
  checkAll() {
    this.setState({
      selected: new Set(this.state.tweets.map(t => t.id_str)),
      delete_modal: true
    });
    Object.values(this.references).map(t => t.current.check());
  }

  uncheckAll() {
    this.setState({
      selected: new Set([]),
      delete_modal: false
    });
    Object.values(this.references).map(t => t.current.uncheck());
  }

  protected checkThisTweets(ids: string[]) {
    const selected = this.state.selected;
    for (const tweet of ids) {
      selected.add(tweet);
    }

    this.setState({
      selected,
      delete_modal: selected.size > 0
    });

    for (const tweet of ids) {
      if (tweet in this.references) {
        this.references[tweet].current.check();
      }
    }
  }

  checkBelow(tweet_id: string) {
    // Check tweets AFTER tweet_id
    const tweet_id_pos = this.state.tweets.findIndex(t => t.id_str === tweet_id);
    if (tweet_id_pos === -1) {
      // tweet does not exists
      console.warn("You're trying to check a tweet that does not exists. This should not happend.");
      return;
    }

    // Check after index (index is NOT included)
    const tweets = this.state.tweets.slice(tweet_id_pos + 1).map(tweet => tweet.id_str);
    this.checkThisTweets(tweets);
  }

  checkUntil(tweet_id: string) {
    // Check tweets UNTIL tweet_id (index IS included)
    const tweet_id_pos = this.state.tweets.findIndex(t => t.id_str === tweet_id);
    if (tweet_id_pos === -1) {
      // tweet does not exists
      console.warn("You're trying to check a tweet that does not exists. This should not happend.");
      return;
    }

    const tweets = this.state.tweets.slice(0, tweet_id_pos + 1).map(tweet => tweet.id_str);
    this.checkThisTweets(tweets);
  }

  revertSelection() {
    const selected = this.state.selected;
    const tweets = this.state.tweets.map(t => t.id_str);
    const new_selected = new Set<string>();

    for (const tweet of tweets) {
      if (!selected.has(tweet)) {
        new_selected.add(tweet);
      }
    }

    this.setState({
      selected: new_selected,
      delete_modal: new_selected.size > 0
    });

    for (const tweet of tweets) {
      if (tweet in this.references) {
        if (new_selected.has(tweet)) {
          this.references[tweet].current.check();
        }
        else {
          this.references[tweet].current.uncheck();
        }
      }
    }
  }

  renderTweet(t: PartialTweet, i: number) {
    this.references[t.id_str] = t.id_str in this.references ? this.references[t.id_str] : React.createRef();
    
    if (t.id_str in this.cache) {
      return this.cache[t.id_str];
    }

    return this.cache[t.id_str] = <Tweet 
      data={t} 
      key={i} 
      ref={this.references[t.id_str]} 
      checked={this.state.selected.has(t.id_str)} 
      onCheckChange={this.onTweetCheckChange} 
    />;
  }

  onTweetCheckChange(checked: boolean, id_str: string) {
    // console.log(this, checked, id_str);
    
    const s = this.state.selected;
    if (checked) {
      s.add(id_str);
    }
    else {
      s.delete(id_str);
    }

    this.setState({ delete_modal: !!s.size, selected: s });
  }

  loader() {
    return (
      <div className={classes.loader} key={0}>
        <CenterComponent>
          <CircularProgress thickness={3} className={classes.loader_real} />
        </CenterComponent>
      </div>
    );
  }

  noTweetsProp() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            {LANG.contains_any_tweets}. :(
          </Typography>
        </CenterComponent>
      </>
    );
  }

  noTweetsState() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            {LANG.contains_any_tweets}. :(
          </Typography>
          <Typography variant="h6">
            {LANG.filters_that_hide}
          </Typography>
        </CenterComponent>
      </>
    );
  }

  noTweetsLeft() {
    return (
      <>
        {this.renderFilters()}
        <CenterComponent className={classes.no_tweets}>
          <NoTweetsIcon className={classes.icon} />
          <Typography variant="h5" style={{marginTop: "1rem", marginBottom: ".7rem"}}>
            {LANG.no_tweets_to_display}
          </Typography>

          <Typography>
            {LANG.deleted_or_no_permission_to_show}
          </Typography>

          <Typography>
            {LANG.try_disable_download}
          </Typography>

          <Typography>
            {LANG.try_another_login_info}
          </Typography>

          <Button component={Link} to="/settings/" color="primary" style={{marginTop: '1.5rem'}}>
            {LANG.settings}
          </Button>
        </CenterComponent>
      </>
    );
  }

  confirmDeletionModal() {
    return (
      <Dialog
        open={true}
        onClose={() => this.closeConfirmModal()}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle>{LANG.delete_selected_tweets} ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {LANG.tweets_deleted_from} <span className="bold">Twitter</span>.
          </DialogContentText>
          <DialogContentText>
            {LANG.deletion_modal_text}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.closeConfirmModal()} color="primary" autoFocus>
            {LANG.no}
          </Button>
          <Button onClick={() => { 
            this.closeConfirmModal();  
            Tasks.start([...this.state.selected], "tweet")
              .catch(() => {
                toast(LANG.task_start_error, "error");
              });
            this.uncheckAll();
          }} color="secondary">
            {LANG.yes}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  askDeletionModal() {
    return (
      <div className={classes.modal_root + 
          (this.state.delete_modal ? " " + classes.open : "") + " "
        }>
        <div className={classes.modal_grid_root}>
          <div className={classes.modal_selected}>
            {this.state.selected.size} {LANG.selected_without_s}{this.state.selected.size > 1 ? LANG.past_s : ''}
          </div> 

          <div className={classes.modal_grid_container}>
            <Button color="primary" onClick={this.onOpenDeleteMenuClick}>
              {LANG.select_tweets_choices}
            </Button>
          </div> 
          
          <div className={classes.modal_grid_container}>
            <Button color="secondary" onClick={() => this.openConfirmModal()}>
              <Icon>delete_sweep</Icon>
            </Button>
          </div> 
        </div>
      </div>
    );
  }

  render() {
    // Pas de tweets donnés
    if (this.props.tweets.length === 0) {
      return this.noTweetsProp();
    }

    // Pas de tweets après filtrage
    if (this.state.tweets.length === 0) {
      return this.noTweetsState();
    }

    // no tweets available (all deleted)
    if (this.state.current_page.length === 0 && !this.state.has_more) {
      return this.noTweetsLeft();
    }

    let tweet_rendered_data: any;
    if (this.props.withMoments) {
      let current_year: number = null;
      let current_year_tweet_count = 0;

      // Render tweets with "year headers" when year changes
      tweet_rendered_data = this.state.current_page.map((tweet, i) => {
        const current_tweet_date = TwitterHelpers.dateFromTweet(tweet).getFullYear();
        const t = this.renderTweet(tweet, i);
        
        if (current_tweet_date !== current_year) {
          // must show year
          current_year = current_tweet_date;
          const previous_count = current_year_tweet_count;
          // Reset the tweet count: we change current year
          current_year_tweet_count = 1;

          return (
            <React.Fragment key={i}>
              {/* 
                If the previous year has a odd tweet count, 
                we must inject a empty container to go to next line (max 2 tweets per line).
              */}
              {previous_count % 2 !== 0 && <div className={classes.card_container} />}

              <div className={classes.card_container_year}>
                <Typography className={classes.year_header}>
                  {LANG.year} {current_tweet_date}
                </Typography>
              </div>
              <div className={classes.card_container} />
        
              {t}
            </React.Fragment>
          );
        }
        else {
          current_year_tweet_count++;

          return t;
        }
      });
    }
    else {
      tweet_rendered_data = this.state.current_page.map(this.renderTweet);
    }

    return (
      <>
        <TweetSelectOptions 
          id={this.state.selected_checkbox && this.state.selected_checkbox.id}
          position={this.state.selected_checkbox && this.state.selected_checkbox.position}
          anchor={this.state.selected_checkbox && this.state.selected_checkbox.element}
          onClose={this.closeSelectedCheckbox}
          onSelectBelow={(id: string) => { this.checkBelow(id); this.closeSelectedCheckbox(); }}
          onSelectUntil={(id: string) => { this.checkUntil(id); this.closeSelectedCheckbox(); }}
        />

        <TweetBulkSelectOptions 
          position={this.state.menu_bulk_delete && this.state.menu_bulk_delete.position}
          anchor={this.state.menu_bulk_delete && this.state.menu_bulk_delete.element}
          onClose={this.closeDeleteMenu}
          onRevertSelection={() => { this.revertSelection(); this.closeDeleteMenu(); }}
          onSelectAll={() => { this.checkAll(); this.closeDeleteMenu(); }}
          onUnSelectAll={() => { this.uncheckAll(); this.closeDeleteMenu(); }}
        />

        {this.renderFilters()}

        {this.state.modal_confirm && this.confirmDeletionModal()}

        {this.askDeletionModal()}
        
        <InfiniteScroll
          className={classes.card_container}
          pageStart={0}
          loadMore={p => this.loadTweets(p)}
          hasMore={this.state.has_more}
          loader={this.loader()}
          key={this.state.scroller_key}
        >
          {tweet_rendered_data}
        </InfiniteScroll>
      </>
    );
  }
}

export function TweetSelectOptions(props: { 
  anchor?: HTMLElement,
  onClose?: () => void,
  onSelectUntil?: (tweet_id: string) => void,
  onSelectUntilFirst?: (tweet_id: string) => void,
  onSelectBelow?: (tweet_id: string) => void,
  onSelectBelowLast?: (tweet_id: string) => void,
  position?: { left: number, top: number },
  id?: string,
}) {
  return (
    <Menu
      anchorEl={props.anchor}
      open={Boolean(props.anchor)}
      onClose={props.onClose}
      anchorPosition={props.position}
      anchorReference="anchorPosition"
    >
      <MenuItem disabled dense>
        {LANG.select_tweets}
      </MenuItem>
      

      {props.id &&
        // Fragments aren't accepted as Menu childs
        [<MenuItem key="until" onClick={() => { props.onSelectUntil && props.onSelectUntil(props.id) }}>
          <ListItemIcon>
            <ArrowUpwardIcon className={classes.menu_tiny_icon} />
          </ListItemIcon>
          <ListItemText primary={LANG.select_tweets_until} />
        </MenuItem>, 
        
        <MenuItem key="until-first" onClick={() => { props.onSelectUntilFirst && props.onSelectUntilFirst(props.id) }}>
          <ListItemIcon>
            <ArrowWithEndIcon className={classes.menu_tiny_icon} style={{ transform: 'rotate(180deg)' }} />
          </ListItemIcon>
          <ListItemText primary={LANG.select_tweets_until_first} />
        </MenuItem>,

        <MenuItem key="below-last" onClick={() => { props.onSelectBelowLast && props.onSelectBelowLast(props.id) }}>
          <ListItemIcon>
            <ArrowWithEndIcon className={classes.menu_tiny_icon} />
          </ListItemIcon>
          <ListItemText primary={LANG.select_tweets_below_last} />
        </MenuItem>,

        <MenuItem key="below" onClick={() => { props.onSelectBelow && props.onSelectBelow(props.id) }}>
          <ListItemIcon>
            <ArrowDownwardIcon className={classes.menu_tiny_icon} />
          </ListItemIcon>
          <ListItemText primary={LANG.select_tweets_below} />
        </MenuItem>]
      }
    </Menu>
  );
}

export function TweetBulkSelectOptions(props: { 
  anchor?: HTMLElement,
  onClose?: () => void,
  onSelectAll?: () => void,
  onUnSelectAll?: () => void,
  onRevertSelection?: () => void,
  position?: { left: number, top: number },
}) {
  return (
    <Menu
      anchorEl={props.anchor}
      open={Boolean(props.anchor)}
      onClose={props.onClose}
      anchorPosition={props.position}
      anchorReference="anchorPosition"
    >
      <MenuItem disabled dense>
        {LANG.tweet_selection}
      </MenuItem>

      <MenuItem onClick={props.onSelectAll}>
        <ListItemIcon>
          <PlusIcon className={classes.menu_tiny_icon} />
        </ListItemIcon>
        <ListItemText primary={LANG.select_all} />
      </MenuItem>

      <MenuItem onClick={props.onUnSelectAll}>
        <ListItemIcon>
          <MinusIcon className={classes.menu_tiny_icon} />
        </ListItemIcon>
        <ListItemText primary={LANG.unselect_all} />
      </MenuItem>

      <MenuItem onClick={props.onRevertSelection}>
        <ListItemIcon>
          <RevertIcon className={classes.menu_tiny_icon} />
        </ListItemIcon>
        <ListItemText primary={LANG.revert_selection} />
      </MenuItem>
    </Menu>
  );
}
