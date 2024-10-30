import React, { useEffect, useRef, useState } from "react";

const Carousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  const RandomImages = () => {
    fetch("/api/randomImages")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setImages(data)})
      .catch((error) => console.error("Fetch error:", error));
  };

  useEffect(() => {
    RandomImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-3/4 lg:w-1/6 overflow-hidden">
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div key={index} className="w-full flex-shrink-0 rounded-lg">
            <img
              src={image}
              className="w-full rounded-lg"
              alt={`Carousel item ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <div className="flex w-full justify-center gap-2 py-2">
        {images.map((_, btnIndex) => (
          <button
            key={btnIndex}
            className={`btn btn-xs hover:bg-secondary ${
              activeIndex === btnIndex ? "bg-primary" : "bg-base-300"
            }`}
            onClick={() => setActiveIndex(btnIndex)}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
