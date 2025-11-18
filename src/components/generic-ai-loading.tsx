import { motion } from "framer-motion";

const PlaceholderSparkleIcon = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.917 4.25L9.095 7.238L12.083 8.417L9.095 9.595L7.917 12.583L6.738 9.595L3.75 8.417L6.738 7.238L7.917 4.25Z"
      fill="url(#paint0_linear_72_472)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_72_472"
        x1="7.9165"
        y1="4.25"
        x2="7.9165"
        y2="12.583"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#E8759C" />
        <stop offset="1" stopColor="#8BA8DB" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * A generic loading component for AI generation, with spinning and breathing animations.
 * @param {object} props
 * @param {string} [props.mainTitle] - The main title, e.g., the note name.
 * @param {string} [props.subtitle] - The text that "breathes," e.g., "Generating Quiz..."
 * @param {string} [props.description] - Additional descriptive text.
 */
export function GenericAILoading({ mainTitle, subtitle, description }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center text-center p-8 gap-6 h-full">
      {/* --- Main Title --- */}
       <motion.h3
        // Animation properties for the "breathing" effect
        className="text-xl font-semibold text-foreground"
        // animate={{
        //     color: [
        //       "#76A9F5", // Start color
        //       "#E0506D", // Middle color
        //       "#76A9F5", // End color (back to start)
        //     ],
        //   }}
        // // Transition settings to make it a smooth, infinite loop
        // transition={{
        //   duration: 1,
        //   ease: "easeInOut",
        //   repeat: Infinity,
        // }}
      >
        {subtitle}
      </motion.h3>

      {/* --- Spinning Icon --- */}
            <div className="animate-spin-slow">
              <motion.div
                  animate={{
                    scale: [1, 2, 1], // Scales from 100% to 110% and back
                  }}
                  transition={{
                    // Use different transition settings for each property
                    scale: {
                      duration: 2,
                      ease: "easeInOut",
                      repeat: Infinity,
                    },
                    rotate: {
                      duration: 5, // 5-second rotation
                      ease: "linear",
                      repeat: Infinity,
                    },
                  }}
                >
                  {/* Replace this with your actual <SparkSingleDarkSVG /> component */}
                <PlaceholderSparkleIcon className="h-20 w-20 text-primary" />
                </motion.div>
            </div>

      {/* --- Description Text --- */}
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
