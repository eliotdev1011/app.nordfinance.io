import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import PlayButton from "../../assets/images/play-button.png";
import PauseButton from "../../assets/images/pause.png";
import "./NftMediaPlayer.css";

function NftMediaPlayer({ animationURL, isThisDetailComponent }) {
  const [isMediaPlaying, setIsMediaPlaying] = useState(isThisDetailComponent);
  const videoRef = useRef(null);
  useEffect(() => {
    if (isMediaPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isMediaPlaying]);
  return (
    <div className="video-container">
      <video loop ref={videoRef}>
        <source src={animationURL} type="video/mp4" />
        Sorry, your browser doesn&apos;t support embedded videos.
      </video>
      <div className="video-controls">
        <button
          type="button"
          onClick={() =>
            setIsMediaPlaying((prevIsMediaPlaying) => !prevIsMediaPlaying)
          }
        >
          <img
            src={isMediaPlaying ? PauseButton : PlayButton}
            id="play-pause-btn"
          />
        </button>
      </div>
    </div>
  );
}

NftMediaPlayer.propTypes = {
  animationURL: PropTypes.string.isRequired,
  isThisDetailComponent: PropTypes.bool.isRequired,
};

export default NftMediaPlayer;
