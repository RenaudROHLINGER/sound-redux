import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';


const propTypes = {
  frequencyData: PropTypes.object,
};

class Vizualizer extends React.Component {
  
  constructor(props) {
    super(props);
  }
  
  componentDidMount() {
    let ctx = ReactDOM
      .findDOMNode(this)  //canvas
      .getContext('2d');

	const canvas = ReactDOM.findDOMNode(this.refs.canvas);
    this.paint(ctx, 200, 200, null);
	canvas.width = window.innerWidth;
	canvas.height = 58;
	canvas.style.position = 'fixed';
	canvas.style.bottom = '48px';
	canvas.style['pointer-events'] = 'none';
	canvas.style['opacity'] = 0.5;
	canvas.style['transform'] = 'translateZ(0)';
	canvas.style['-webkit-transform'] = 'translateZ(0)';
	canvas.style['mix-blend-mode'] = 'color';
  }

  componentDidUpdate() {
  	const canvas = ReactDOM.findDOMNode(this.refs.canvas);
  	const context = canvas.getContext('2d');
	  canvas.width = window.innerWidth;
    this.paint(context, canvas.width, canvas.height);
  }

  paint(canvasContext, width, height, analyser) {
    canvasContext.clearRect(0, 0, width, height);
    const { frequencyData, vibrant } = this.props;
    const frequencyWidth = (width / 512);
    let frequencyHeight = 0,
      x = 0;
    if(!frequencyData) {
    	return;
    }

    for (var increment = 0; increment < 1024; increment++) {
      frequencyHeight = frequencyData[increment] * (height * 0.003);
      canvasContext.fillStyle = vibrant.DarkVibrant;
      canvasContext.fillRect(x, height - frequencyHeight, frequencyWidth, frequencyHeight);
      x += frequencyWidth + 2;
    }
  }

  render() {
    return <canvas ref="canvas" width={200} height={200} />;
  }
}


Vizualizer.propTypes = propTypes;

export default Vizualizer;