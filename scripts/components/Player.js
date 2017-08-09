import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { changeCurrentTime, changeSong, toggleIsPlaying } from '../actions/PlayerActions';
import Playlist from '../components/Playlist';
import Popover from '../components/Popover';
import Vibrant from 'node-vibrant';
import Vizualizer from '../components/Vizualizer';
import SongDetails from '../components/SongDetails';
import { CHANGE_TYPES } from '../constants/SongConstants';
import { formatSeconds, formatStreamUrl } from '../utils/FormatUtils';
import { offsetLeft } from '../utils/MouseUtils';
import { getImageUrl } from '../utils/SongUtils';
import LocalStorageUtils from '../utils/LocalStorageUtils';

const propTypes = {
  dispatch: PropTypes.func.isRequired,
  player: PropTypes.object.isRequired,
  playingSongId: PropTypes.number,
  playlists: PropTypes.object.isRequired,
  song: PropTypes.object,
  songs: PropTypes.object.isRequired,
  users: PropTypes.object.isRequired,
};

class Player extends Component {
  constructor(props) {
    super(props);
    this.changeSong = this.changeSong.bind(this);
    this.changeVolume = this.changeVolume.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleLoadedMetadata = this.handleLoadedMetadata.bind(this);
    this.handleLoadStart = this.handleLoadStart.bind(this);
    this.handleSeekMouseDown = this.handleSeekMouseDown.bind(this);
    this.handleSeekMouseMove = this.handleSeekMouseMove.bind(this);
    this.handleSeekMouseUp = this.handleSeekMouseUp.bind(this);
    this.handleVolumeMouseDown = this.handleVolumeMouseDown.bind(this);
    this.handleVolumeMouseMove = this.handleVolumeMouseMove.bind(this);
    this.handleVolumeMouseUp = this.handleVolumeMouseUp.bind(this);
    this.handlePlay = this.handlePlay.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleVolumeChange = this.handleVolumeChange.bind(this);
    this.seek = this.seek.bind(this);
    this.toggleMute = this.toggleMute.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
    this.toggleRepeat = this.toggleRepeat.bind(this);
    this.toggleShuffle = this.toggleShuffle.bind(this);
    this.toggleVizualizer = this.toggleVizualizer.bind(this);




    const previousVolumeLevel = Number.parseFloat(LocalStorageUtils.get('volume'));
    this.state = {
      activePlaylistIndex: null,
      currentTime: 0,
      duration: 0,
      isSeeking: false,
      muted: false,
      vibrant: {},
      frequencyData: null,
      analyser: null,
      repeat: false,
      shuffle: false,
      loopVizualizer: undefined,
      booleanVizualizer: false,
      volume: previousVolumeLevel || 1,
    };
  }


  getProminent(img) {
    const swatchesObjts = {};
    const newImage = new window.Image();
    newImage.crossOrigin = 'Anonymous';
    newImage.setAttribute("src", img.target.src);

    let vibrant = new Vibrant(newImage);
    const self = this;
    vibrant.getSwatches(function(err, swatchObj) {
      if (err) {
        return;
      }
      for (var name in swatchObj) {
        if (swatchObj.hasOwnProperty(name) && swatchObj[name]) {
          swatchesObjts[name] = {
            hex: swatchObj[name].getHex(),
            rgb: swatchObj[name].rgb
          }
        }
      }
      self.renderHoverStyle(swatchesObjts);
    })
  }

  renderHoverStyle(swatchesObjts) {
    let swatches = '';
    let vibrant = {};

    if(Object.keys(swatchesObjts).length > 0) {
      swatches = `linear-gradient(45deg, ${swatchesObjts.DarkMuted.hex}, ${swatchesObjts.Muted.hex}, ${swatchesObjts.LightMuted.hex})`;
      document.querySelector('body').style['background-image'] = swatches;

      vibrant['swatches'] = swatches;
      vibrant['Muted'] = swatchesObjts.Muted.hex;
      vibrant['Vibrant'] = swatchesObjts.Vibrant ? swatchesObjts.Vibrant.hex : swatchesObjts.LightMuted.hex;
      vibrant['LightMuted'] = swatchesObjts.LightMuted.hex;
      vibrant['DarkMuted'] = swatchesObjts.DarkMuted.hex;
      vibrant['LightVibrant'] = swatchesObjts.LightVibrant ? swatchesObjts.LightVibrant.hex : swatchesObjts.LightMuted.hex;
      vibrant['DarkVibrant'] = swatchesObjts.DarkVibrant ? swatchesObjts.DarkVibrant : swatchesObjts.Muted.hex;

      this.setState({
        vibrant
      });
    }
  }


  tick() {
    setTimeout(function() {
      //frequencyData = this.state.getByteFrequencyData(frequencyData);
      // width canvas / analyz
      const bufferLength = this.state.analyser.frequencyBinCount;
      const frequencyData = new Uint8Array(bufferLength);
      this.state.analyser.getByteFrequencyData(frequencyData)
      this.setState({
        frequencyData: frequencyData
      })
      this.startVizualizer();
      //requestAnimationFrame(this.tick.bind(this));
    }.bind(this), 1000/ 30);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);

    //const newAudio = new window.Audio();
    audioElement.crossOrigin = 'Anonymous';
    audioElement.src = audioElement.src;

    const context = new (window.AudioContext || window.webkitAudioContext)();
    const source = context.createMediaElementSource(audioElement);
    const analyser = context.createAnalyser();
    //analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(context.destination);

    this.setState({
      audio: audioElement,
      analyser: analyser,
      //audioCtx: audioContext
    })

    audioElement.addEventListener('ended', this.handleEnded, false);
    audioElement.addEventListener('loadedmetadata', this.handleLoadedMetadata, false);
    audioElement.addEventListener('loadstart', this.handleLoadStart, false);
    audioElement.addEventListener('pause', this.handlePause, false);
    audioElement.addEventListener('play', this.handlePlay, false);
    audioElement.addEventListener('timeupdate', this.handleTimeUpdate, false);
    audioElement.addEventListener('volumechange', this.handleVolumeChange, false);
    audioElement.volume = this.state.volume;
    audioElement.play();
    //requestAnimationFrame(this.tick.bind(this));
  }

  componentDidUpdate(prevProps) {
    if (prevProps.playingSongId && prevProps.playingSongId === this.props.playingSongId) {
      return;
    }

    const audioElement = ReactDOM.findDOMNode(this.refs.audio);
    audioElement.crossOrigin = 'Anonymous';

    //const newAudio = new window.Audio();
    //const context = new (window.AudioContext || window.webkitAudioContext)();
    //const source = context.createMediaElementSource(audioElement);
    //const analyser = context.createAnalyser();
    
    requestAnimationFrame(this.tick.bind(this));
    audioElement.play();
    //ReactDOM.findDOMNode(this.refs.audio).play();
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown, false);
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);
    audioElement.removeEventListener('ended', this.handleEnded, false);
    audioElement.removeEventListener('loadedmetadata', this.handleLoadedMetadata, false);
    audioElement.removeEventListener('loadstart', this.handleLoadStart, false);
    audioElement.removeEventListener('pause', this.handlePause, false);
    audioElement.removeEventListener('play', this.handlePlay, false);
    audioElement.removeEventListener('timeupdate', this.handleTimeUpdate, false);
    audioElement.removeEventListener('volumechange', this.handleVolumeChange, false);
  }

  bindSeekMouseEvents() {
    document.addEventListener('mousemove', this.handleSeekMouseMove);
    document.addEventListener('mouseup', this.handleSeekMouseUp);
  }

  bindVolumeMouseEvents() {
    document.addEventListener('mousemove', this.handleVolumeMouseMove);
    document.addEventListener('mouseup', this.handleVolumeMouseUp);
  }

  changeSong(changeType) {
    const { dispatch } = this.props;
    dispatch(changeSong(changeType));
  }

  changeVolume(e) {
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);
    const volume = (e.clientX - offsetLeft(e.currentTarget)) / e.currentTarget.offsetWidth;
    audioElement.volume = volume;
  }

  startVizualizer() {
    //if(this.state.loopVizualizer !== undefined) {
      let loopVizualizer = null;
      loopVizualizer = window.requestAnimationFrame(this.tick.bind(this));
      //console.log(loopVizualizer);
      this.setState({
        loopVizualizer
      })
    //}
  }

  stopVizualizer() {
    window.cancelAnimationFrame(this.state.loopVizualizer);
    this.state.loopVizualizer = undefined;

    this.setState({
      loopVizualizer
    })
  }

  handleEnded() {
    if (this.state.repeat) {
      ReactDOM.findDOMNode(this.refs.audio).play();
    } else if (this.state.shuffle) {
      this.changeSong(CHANGE_TYPES.SHUFFLE);
    } else {
      this.changeSong(CHANGE_TYPES.NEXT);
    }
  }

  handleLoadedMetadata() {
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);

    // const newAudio = new window.Audio();
    // newAudio.crossOrigin = 'Anonymous';
    // newAudio.setAttribute("src", audioElement.src);
    // console.log(newAudio)
    // const audioContext = new (AudioContext || webkitAudioContext);

    this.setState({
      // audio: newAudio,
      // audioCtx: audioContext,
      duration: Math.floor(audioElement.duration),

    })
  }

  handleLoadStart() {
    const { dispatch } = this.props;
    dispatch(changeCurrentTime(0));
    this.setState({
      duration: 0,
    });
  }

  handleMouseClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handlePause() {
    const { dispatch } = this.props;
    const call = null
    dispatch(toggleIsPlaying(false));
  }

  handlePlay() {
    const { dispatch } = this.props;
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);

    //const newAudio = new window.Audio();
    //newAudio.src = audioElement.src;
    //newAudio.crossOrigin = 'Anonymous';

    // const audioContext = new (AudioContext || webkitAudioContext);


    // const source = audioContext.createMediaElementSource(audioElement);
    // const analyser = audioContext.createAnalyser();
    // source.connect(analyser);
    // analyser.connect(audioContext.destination);

    this.setState({
      //analyser: analyser,
      duration: Math.floor(audioElement.duration),

    })

    dispatch(toggleIsPlaying(true));
    //this.renderVizualiser(analyser,frequencyData);
  }

  handleSeekMouseDown() {
    this.bindSeekMouseEvents();
    this.setState({
      isSeeking: true,
    });
  }

  handleSeekMouseMove(e) {
    const { dispatch } = this.props;
    const seekBar = ReactDOM.findDOMNode(this.refs.seekBar);
    const diff = e.clientX - offsetLeft(seekBar);
    const pos = diff < 0 ? 0 : diff;
    let percent = pos / seekBar.offsetWidth;
    percent = percent > 1 ? 1 : percent;

    dispatch(changeCurrentTime(Math.floor(percent * this.state.duration)));
  }

  handleSeekMouseUp() {
    if (!this.state.isSeeking) {
      return;
    }

    document.removeEventListener('mousemove', this.handleSeekMouseMove);
    document.removeEventListener('mouseup', this.handleSeekMouseUp);
    const { currentTime } = this.props.player;

    this.setState({
      isSeeking: false,
    }, () => {
      ReactDOM.findDOMNode(this.refs.audio).currentTime = currentTime;
    });
  }

  handleTimeUpdate(e) {
    if (this.state.isSeeking) {
      return;
    }

    const { dispatch, player } = this.props;
    const audioElement = e.currentTarget;
    const currentTime = Math.floor(audioElement.currentTime);

    if (currentTime === player.currentTime) {
      return;
    }

    dispatch(changeCurrentTime(currentTime));
  }

  handleVolumeChange(e) {
    if (this.state.isSeeking) {
      return;
    }

    const volume = e.currentTarget.volume;
    LocalStorageUtils.set('volume', volume);
    this.setState({
      volume,
    });
  }

  handleVolumeMouseDown() {
    this.bindVolumeMouseEvents();
    this.setState({
      isSeeking: true,
    });
  }

  handleVolumeMouseMove(e) {
    const volumeBar = ReactDOM.findDOMNode(this.refs.volumeBar);
    const diff = e.clientX - offsetLeft(volumeBar);
    const pos = diff < 0 ? 0 : diff;
    let percent = pos / volumeBar.offsetWidth;
    percent = percent > 1 ? 1 : percent;

    this.setState({
      volume: percent,
    });
    ReactDOM.findDOMNode(this.refs.audio).volume = percent;
  }

  handleVolumeMouseUp() {
    if (!this.state.isSeeking) {
      return;
    }

    document.removeEventListener('mousemove', this.handleVolumeMouseMove);
    document.removeEventListener('mouseup', this.handleVolumeMouseUp);

    this.setState({
      isSeeking: false,
    });
    LocalStorageUtils.set('volume', this.state.volume);
  }

  handleKeyDown(e) {
    const keyCode = e.keyCode || e.which;
    const isInsideInput = e.target.tagName.toLowerCase().match(/input|textarea/);
    if (isInsideInput) {
      return;
    }

    if (keyCode === 32) {
      e.preventDefault();
      this.togglePlay();
    } else if (keyCode === 37 || keyCode === 74) {
      e.preventDefault();
      this.changeSong(CHANGE_TYPES.PREV);
    } else if (keyCode === 39 || keyCode === 75) {
      e.preventDefault();
      this.changeSong(CHANGE_TYPES.NEXT);
    }
  }

  seek(e) {
    const { dispatch } = this.props;
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);
    const percent = (e.clientX - offsetLeft(e.currentTarget)) / e.currentTarget.offsetWidth;
    const currentTime = Math.floor(percent * this.state.duration);

    dispatch(changeCurrentTime(currentTime));
    audioElement.currentTime = currentTime;
  }

  toggleMute() {
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);
    if (this.state.muted) {
      audioElement.muted = false;
    } else {
      audioElement.muted = true;
    }

    this.setState({ muted: !this.state.muted });
  }

  togglePlay() {
    const { isPlaying } = this.props.player;
    const audioElement = ReactDOM.findDOMNode(this.refs.audio);
    if (isPlaying) {
      audioElement.pause();
    } else {
      this.setState({
        audioElement
      });
      audioElement.play();
    }
  }

  toggleRepeat() {
    this.setState({ repeat: !this.state.repeat });
  }

  toggleVizualizer() {
    const { loopVizualizer } = this.state;

    if (loopVizualizer) {
      loopVizualizer ? this.startVizualizer() : this.stopVizualizer();
    }
  }

  toggleShuffle() {
    this.setState({ shuffle: !this.state.shuffle });
  }

  renderDurationBar() {
    const { currentTime } = this.props.player;
    const { duration, vibrant } = this.state;

    if (duration !== 0) {
      const width = currentTime / duration * 100;
      return (
        <div
          className="player-seek-duration-bar"
          style={{ width: `${width}%`, backgroundColor: vibrant.LightVibrant }}
        >
          <div
            className="player-seek-handle"
            onClick={this.handleMouseClick}
            onMouseDown={this.handleSeekMouseDown}
          />
        </div>
      );
    }

    return null;
  }

  renderPlaylist() {
    const { dispatch, player, playlists, songs } = this.props;
    return (
      <Playlist
        dispatch={dispatch}
        player={player}
        playlists={playlists}
        songs={songs}
      />
    );
  }

  renderVolumeBar() {
    const { muted, volume, vibrant } = this.state;
    const width = muted ? 0 : volume * 100;
    return (
      <div
        className="player-seek-duration-bar"
        style={{ width: `${width}%`, backgroundColor: vibrant.LightVibrant }}
      >
        <div
          className="player-seek-handle"
          onClick={this.handleMouseClick}
          onMouseDown={this.handleVolumeMouseDown}
        />
      </div>
    );
  }

  renderVolumeIcon() {
    const { muted, volume } = this.state;

    if (muted) {
      return <i className="icon ion-android-volume-off" />;
    }

    if (volume === 0) {
      return <i className="icon ion-android-volume-mute" />;
    } else if (volume === 1) {
      return (
        <div className="player-volume-button-wrap">
          <i className="icon ion-android-volume-up" />
          <i className="icon ion-android-volume-mute" />
        </div>
      );
    }

    return (
      <div className="player-volume-button-wrap">
        <i className="icon ion-android-volume-down" />
        <i className="icon ion-android-volume-mute" />
      </div>
    );
  }

  render() {
    const { dispatch, player, playingSongId, songs, users } = this.props;
    const { isPlaying } = player;
    const song = songs[playingSongId];
    const user = users[song.user_id];
    const { currentTime } = player;
    const { duration, vibrant, frequencyData, loopVizualizer } = this.state;

    const prevFunc = this.changeSong.bind(this, CHANGE_TYPES.PREV);
    const nextFunc = this.changeSong.bind(
      this,
      this.state.shuffle ? CHANGE_TYPES.SHUFFLE : CHANGE_TYPES.NEXT
    );

    return (
      <div>
        <div className="player"  style={{ backgroundImage: vibrant.swatches }}>
          <audio id="audio" crossOrigin="anonymous" ref="audio" src={formatStreamUrl(song.stream_url)} />

          <div className="container">
            <div className="player-main">
              <div className="player-section player-info">
                <img
                  alt="song artwork"
                  className="player-image"
                  src={getImageUrl(song.artwork_url)}
                  crossOrigin="anonymous"
                  onLoad={this.getProminent.bind(this)}
                />
                <SongDetails
                  dispatch={dispatch}
                  songId={song.id}
                  title={song.title}
                  vibrant={vibrant}
                  userId={user.id}
                  username={user.username}
                />
              </div>
              <div className="player-section">
                <div
                  className="player-button"
                  onClick={prevFunc}
                >
                  <i className="icon ion-ios-rewind" style={{ color: vibrant.LightMuted }} />
                </div>
                <div
                  className="player-button"
                  onClick={this.togglePlay}
                >
                  <i className={`icon ${(isPlaying ? 'ion-ios-pause' : 'ion-ios-play')}`} style={{ color: vibrant.LightMuted }} />
                </div>
                <div
                  className="player-button"
                  onClick={nextFunc}
                >
                  <i className="icon ion-ios-fastforward" style={{ color: vibrant.LightMuted }} />
                </div>
              </div>
              <div className="player-section player-seek">
                <div className="player-seek-bar-wrap" onClick={this.seek}>
                  <div className="player-seek-bar" ref="seekBar" style={{backgroundColor: vibrant.DarkMuted}}>
                    {this.renderDurationBar()}
                  </div>
                </div>
                <div className="player-time" style={{ color: vibrant.DarkMuted }}>
                  <span>{formatSeconds(currentTime)}</span>
                  <span className="player-time-divider">/</span>
                  <span>{formatSeconds(duration)}</span>
                </div>
              </div>
              <div className="player-section">
                <div
                  className={`player-button ${(this.state.repeat ? ' active' : '')}`}
                  onClick={this.toggleRepeat}
                >
                  <i className="icon ion-loop" style={{ color: vibrant.DarkMuted }} />
                </div>
                <div
                  className={`player-button ${(this.state.shuffle ? ' active' : '')}`}
                  onClick={this.toggleShuffle}
                >
                  <i className="icon ion-shuffle" style={{ color: vibrant.DarkMuted }} />
                </div>  
                <div
                  className={`player-button ${(this.state.shuffle ? ' active' : '')}`}
                  onClick={this.toggleVizualizer}
                >
                  <i className="icon ion-shuffle" style={{ color: vibrant.DarkMuted }} />
                </div>
                <Popover className="player-button top-right">
                  <i className="icon ion-android-list" style={{ color: vibrant.DarkMuted }} />
                  {this.renderPlaylist()}
                </Popover>
                <div
                  className="player-button player-volume-button"
                  onClick={this.toggleMute}
                  style={{ color: vibrant.DarkMuted }}
                >
                  {this.renderVolumeIcon()}
                </div>
                <div className="player-volume">
                  <div className="player-seek-bar-wrap" onClick={this.changeVolume}>
                    <div className="player-seek-bar" ref="volumeBar" style={{ backgroundColor: vibrant.DarkMuted }}>
                      {this.renderVolumeBar()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Vizualizer frequencyData={frequencyData} vibrant={vibrant} />
      </div>
    );
  }
}

Player.propTypes = propTypes;

export default Player;
