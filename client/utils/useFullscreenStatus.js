import React from "react";

export default function useFullscreenStatus(elRef) {
  // const [isFullscreen, setIsFullscreen] = React.useState(
  //   document[getBrowserFullscreenElementProp()] != null
  // );
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const setFullscreen = () => {
    if (elRef.current == null) return;

    elRef.current
      .requestFullscreen()
      .then(() => {
        setIsFullscreen(document[getBrowserFullscreenElementProp()] != null);
      })
      .catch(() => {
        setIsFullscreen(false);
      });
  };

  if (typeof window !== "undefined") {
    React.useLayoutEffect(() => {
      document.onfullscreenchange = () =>
        setIsFullscreen(document[getBrowserFullscreenElementProp()] != null);
      
      return () => (document.onfullscreenchange = undefined);
    });
  }

  return [isFullscreen, setFullscreen];
}

function getBrowserFullscreenElementProp() {
  if (typeof window == "undefined") {
    throw new Error("fullscreenElement is not supported by this browser");
  }
  if (typeof document.fullscreenElement !== "undefined") {
    return "fullscreenElement";
  } else if (typeof document.mozFullScreenElement !== "undefined") {
    return "mozFullScreenElement";
  } else if (typeof document.msFullscreenElement !== "undefined") {
    return "msFullscreenElement";
  } else if (typeof document.webkitFullscreenElement !== "undefined") {
    return "webkitFullscreenElement";
  } else {
    throw new Error("fullscreenElement is not supported by this browser");
  }
}
