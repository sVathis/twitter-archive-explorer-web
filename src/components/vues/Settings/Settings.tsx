import React from 'react';
import classes from './Settings.module.scss';
import { setPageTitle } from '../../../helpers';
import { AppBar, Toolbar, Typography, Container, Checkbox, FormControlLabel, FormLabel, FormControl, FormGroup, Divider, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@material-ui/core';
import SETTINGS from '../../../tools/Settings';

type SettingsState = {
  only_medias: boolean;
  only_videos: boolean;
  download: boolean;
  only_rts: boolean;
  modal_open: boolean;
}

export default class Settings extends React.Component<{}, SettingsState> {
  state: SettingsState = {
    only_medias: SETTINGS.only_medias,
    only_videos: SETTINGS.only_videos,
    download: SETTINGS.tweet_dl,
    only_rts: SETTINGS.only_rts,
    modal_open: false
  };

  changeMediaState(v: boolean) {
    this.setState({
      only_medias: v
    });
    SETTINGS.only_medias = v;
  }

  changeVideoState(v: boolean) {
    this.setState({
      only_videos: v
    });
    SETTINGS.only_videos = v;
  }

  changeTweetDLState(v: boolean) {
    this.setState({
      download: v
    });
    SETTINGS.tweet_dl = v;
  }

  changeRTState(v: boolean) {
    this.setState({
      only_rts: v
    });
    SETTINGS.only_rts = v;
  }

  componentDidMount() {
    setPageTitle("Settings");
  }

  tweetViewSettings() {
    return (
      <FormControl component="fieldset">
        <FormLabel focused style={{marginTop: '1rem', marginBottom: '.5rem'}}>Media settings</FormLabel>
        <FormGroup>
          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary"
                checked={this.state.only_medias}
                onChange={(_, c) => this.changeMediaState(c)} 
              />
            }
            label="Show only tweets with medias"
            labelPlacement="end"
          />

          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.only_videos}
                onChange={(_, c) => this.changeVideoState(c)}
              />
            }
            label="Show only tweets with videos or GIFs"
            labelPlacement="end"
          />
        </FormGroup>

        <FormLabel focused style={{marginTop: '1rem', marginBottom: '.5rem'}}>Tweet settings</FormLabel>
        <FormGroup>
          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.download}
                onChange={(_, c) => this.changeTweetDLState(c)}
              />
            }
            label="Download tweets from Twitter (gives more accurate infos)"
            labelPlacement="end"
          />

          <FormControlLabel
            value="media"
            control={
              <Checkbox 
                color="primary" 
                checked={this.state.only_rts}
                onChange={(_, c) => this.changeRTState(c)} 
              />
            }
            label="Show only retweets (hide you own tweets)"
            labelPlacement="end"
          />
        </FormGroup>
      </FormControl>
    );
  }

  accountSettings() {
    return (
      <div>
        <Button onClick={() => this.handleClickOpen()}>
          Logout
        </Button>
      </div>
    );
  }

  handleClickOpen() {
    this.setState({ modal_open: true });
  }

  handleClose() {
    this.setState({ modal_open: false });
  }

  modalLogout() {
    return (
      <Dialog
        open={this.state.modal_open}
        onClose={() => this.handleClose()}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Logout</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do you want to log out ? You can't use this application again until you're logged in again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.handleClose()} color="primary" autoFocus>
            Cancel
          </Button>
          <Button onClick={() => SETTINGS.logout()} color="secondary">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  render() {
    return (
      <div>
        {this.modalLogout()}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" color="inherit">
              Settings
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" style={{marginTop: '1rem'}}>
          <Typography variant="h4" className="bold">
            Tweet view
          </Typography>
          <Container>
            {this.tweetViewSettings()}
          </Container>

          <Divider className="divider-big-margin" />

          <Typography variant="h4" className="bold">
            Account
          </Typography>
          <Container>
            {this.accountSettings()}
          </Container>
        </Container>
      </div>
    );
  }
}