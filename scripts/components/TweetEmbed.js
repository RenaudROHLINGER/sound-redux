import React, { Component, PropTypes } from 'react'

const callbacks = []

function addScript (src, cb) {
  if (callbacks.length === 0) {
    callbacks.push(cb)
    var s = document.createElement('script')
    s.setAttribute('src', src)
    s.onload = () => callbacks.forEach((cb) => cb())
    document.body.appendChild(s)
  } else {
    callbacks.push(cb)
  }
}

class TweetEmbed extends Component {
  componentDidMount () {
    const renderTweet = () => {
      window.twttr.ready().then(({ widgets }) => {
        const { options, onTweetLoadSuccess, onTweetLoadError } = this.props
        widgets
          .createTimeline({sourceType: "profile", screenName: this.props.username}, this._div, options)
          .then(onTweetLoadSuccess)
          .catch(onTweetLoadError)
      })
    }

    if (!window.twttr) {
      const isLocal = window.location.protocol.indexOf('file') >= 0
      const protocol = isLocal ? this.props.protocol : ''

      addScript(`//platform.twitter.com/widgets.js`, renderTweet)
    } else {
      renderTweet()
    }
  }

  render () {
    return <div className="twitter-embedded" ref={(c) => {
      this._div = c
    }} />
  }
}

TweetEmbed.propTypes = {
  id: PropTypes.string,
  options: PropTypes.object,
  protocol: PropTypes.string,
  onTweetLoadSuccess: PropTypes.func,
  onTweetLoadError: PropTypes.func
}

TweetEmbed.defaultProps = {
  protocol: 'http:',
  options: {}
}

export default TweetEmbed