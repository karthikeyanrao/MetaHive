import React from 'react';

function Marquee() {
  const imageUrls = [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=70",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=70",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=70",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=70",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?w=600&q=70",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=70"
  ];

  // Duplicate the array for a seamless infinite loop
  const displayImages = [...imageUrls, ...imageUrls];

  return (
    <section className="bg-bg border-y border-border py-6 overflow-hidden">
      <div className="flex gap-4 w-max animate-marquee">
        {displayImages.map((src, index) => (
          <img 
            key={index}
            src={src} 
            alt={`Property preview ${index + 1}`} 
            className="h-48 w-72 object-cover rounded-lg flex-shrink-0"
          />
        ))}
      </div>
    </section>
  );
}

export default Marquee;
