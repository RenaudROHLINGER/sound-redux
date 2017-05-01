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
    this.paint(ctx, 200, 200, null);
  }

  componentDidUpdate() {
  	const canvas = ReactDOM.findDOMNode(this.refs.canvas);
  	const context = canvas.getContext('2d');

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight / 2;

    this.paint(context, canvas.width, canvas.height);
  }

  paint(canvasContext, width, height, analyser) {
    canvasContext.clearRect(0, 0, width, height);
    const { frequencyData } = this.props;
    const frequencyWidth = (600 / 1024);
    let frequencyHeight = 0,
      x = 0;
    if(!frequencyData) {
    	return;
    }
    for (var increment = 0; increment < 1024; increment++) {
      frequencyHeight = frequencyData[increment] * (height * 0.003);
      canvasContext.fillStyle = 'rgb(255, 120, 120)';
      canvasContext.fillRect(x, height - frequencyHeight, frequencyWidth, frequencyHeight);
      x += frequencyWidth + 4;
    }
  }

  render() {
    return <canvas ref="canvas" width={200} height={200} />;
  }
}


Vizualizer.propTypes = propTypes;

export default Vizualizer;