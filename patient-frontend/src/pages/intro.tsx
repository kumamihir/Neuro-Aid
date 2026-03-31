import { Brain, HeartPulse, Stethoscope, Smile, Moon, Sun } from "lucide-react";
import { MapPin, BellRing, CalendarClock, Bot, Gamepad2 } from "lucide-react";
import {
  Users2,
  FileHeart,
  PhoneCall,
  MessageCircleHeart
} from "lucide-react";


import React, { useState, useEffect } from "react";

export default function Intro(): JSX.Element {
  const [popupContent, setPopupContent] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  {/* State for image preview */}
const [selectedImage, setSelectedImage] = useState<string | null>(null);


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-700
      ${darkMode ? "bg-gray-900 text-gray-200" : "bg-gradient-to-b from-emerald-50 to-white text-gray-800"}`}
    >
      {/* Navbar */}
      <header
        className={`flex justify-start items-center px-4 py-3 sticky top-0 z-50 transition-colors duration-700
        ${darkMode ? "bg-gray-800" : "bg-emerald-600"}`}
      >
        <div className="flex items-center h-12 space-x-2">
         <img
         src="/logo.jpg"
         alt="Neuro-Aid Logo"
         className="h-full w-12 object-cover rounded-full shadow-md"
         width={48}
         height={48}
         loading="lazy"
/>

          <h1
            className="text-xl font-bold whitespace-nowrap
            transition-colors duration-500
            dark:text-emerald-400 text-white"
          >
            Neuro-Aid
          </h1>
        </div>

        <nav aria-label="Primary navigation" className="flex items-center gap-4 ml-auto text-sm">
          <ul className="flex items-center gap-4">
            {["home", "dementia", "about", "features", "contact"].map((section) => (
              <li key={section}>
                <a
                  href={`#${section}`}
                  className={`font-semibold transition-colors duration-300 ${
                    darkMode
                      ? "text-gray-300 hover:text-emerald-400"
                      : "text-white hover:text-emerald-200"
                  } hover:scale-110 transform focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 rounded`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="/app"
            className={`ml-6 px-4 py-1 font-semibold rounded transition
              ${darkMode
                ? "bg-emerald-700 text-emerald-200 hover:bg-emerald-600"
                : "bg-white text-emerald-600 hover:bg-emerald-100"} 
                hover:scale-110 transform focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1`}
          >
            Get Started
          </a>

          {/* Dark Mode Toggle */}
          <button
            aria-label="Toggle Dark Mode"
            onClick={() => setDarkMode(!darkMode)}
            className="ml-4 p-2 rounded-full hover:bg-emerald-500/20 transition transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
            title="Toggle Dark Mode"
            type="button"
          >
            {darkMode ? (
              <Sun className="w-6 h-6 text-yellow-400 animate-spin-slow" />
            ) : (
              <Moon className="w-6 h-6 text-gray-800" />
            )}
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="px-6 py-20 max-w-6xl mx-auto">
        <div
          className={`bg-emerald-50 dark:bg-gray-800 rounded-2xl shadow-lg p-10 flex flex-col md:flex-row items-center gap-10
            transform transition-transform duration-700 ease-out hover:scale-[1.05] hover:shadow-2xl`}
        >
          <div className="flex-1 text-center md:text-left">
            <h2
              className={`text-5xl font-extrabold mb-6 leading-tight
              ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}
            >
              Empower Your Mind, Relax Your Soul <br /> & Connect with Care
            </h2>
            <p
              className={`text-lg max-w-xl mb-8
              ${darkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              Neuro-Aid combines mental fitness, meditation, and instant medical support — a single place to stay sharp, peaceful, and safe.
            </p>
            <a
              href="/app"
              className="inline-block mt-4 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg shadow-lg hover:bg-emerald-500 transition transform hover:scale-110"
            >
              Get Started
            </a>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <img
              src="https://tse2.mm.bing.net/th/id/OIP.usZ4ol_tmI1IZaSjWYANowHaE8?cb=thfc1&rs=1&pid=ImgDetMain&o=7&rm=3"
              alt="Mind & Wellness"
              className="rounded-xl shadow-xl max-w-full h-auto object-cover
                transform transition-transform duration-1000 hover:rotate-3 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* Dementia Awareness Section */}
      <section id="dementia" className="px-10 py-20 max-w-6xl mx-auto">
        <div
          className="bg-emerald-50 dark:bg-gray-800 rounded-2xl shadow-lg p-10 flex flex-col md:flex-row items-center gap-10"
        >
          <div className="flex-1 flex justify-center md:justify-start">
            <img
              src="/dementia.jpg"
              alt="Dementia Awareness"
              className="rounded-xl shadow-xl max-w-full h-auto object-cover transform hover:scale-110 transition duration-700"
            />
          </div>
          <div
            className={`flex-1 text-center md:text-left
            ${darkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            <h3
              className={`text-4xl font-bold mb-6
              ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}
            >
              Dementia on the Rise: A Growing Concern
            </h3>
            <p className="leading-relaxed text-lg tracking-wide">
              Dementia is no longer confined to older generations. Research indicates a significant increase in cognitive disorders among both the elderly and younger adults due to lifestyle changes, stress, and genetic factors. Early detection and proactive mental care are essential for slowing its progression and maintaining quality of life.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-10 py-20 max-w-6xl mx-auto">
        <div
          className={`bg-emerald-50 dark:bg-gray-800 rounded-2xl shadow-lg p-10 text-center`}
        >
          <h3
            className={`text-4xl font-bold mb-10
            ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}
          >
            About Neuro-Aid
          </h3>
          <div
            className={`max-w-5xl mx-auto text-lg leading-relaxed tracking-wide
            ${darkMode ? "text-gray-300" : "text-gray-700"}`}
          >
            <p className="mb-6">
              At Neuro-Aid, we believe mental health is as vital as physical health. Our platform blends science-backed exercises, guided meditation, and instant medical access to create a holistic digital companion.
            </p>
            <p className="mb-6">
              Whether you want to sharpen your memory through fun brain quizzes, find calm through guided meditation, or reach a doctor during emergencies, Neuro-Aid is here to support you at every step.
            </p>
            <p className="font-bold">Our goal is to provide a clear, modern, and user-friendly interface that feels intuitive while being powerful.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-10 py-20 max-w-6xl mx-auto">
        <div
          className={`bg-emerald-50 dark:bg-gray-800 rounded-2xl shadow-lg p-10`}
        >
          <h3
            className={`text-4xl font-bold text-center mb-16
            ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}
          >
            Core Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
  {
    icon: MapPin,
    title: "Geo-Fencing Safety",
    desc: "Automatically shares your location when outside of a safe zone — keeping caregivers informed.",
  },
  {
    icon: BellRing,
    title: "Smart Notifications",
    desc: "Reminders with second confirmation — if ignored, alerts your doctor automatically.",
  },
  {
    icon: CalendarClock,
    title: "AI Appointment Booking",
    desc: "Learns from past bookings to schedule future appointments automatically.",
  },
  {
    icon: Bot,
    title: "Personalized AI",
    desc: "An AI companion that understands your needs and gives tailored support.",
  },
  {
    icon: Smile, // reusing existing icon for meditation
    title: "Meditation & Mindfulness",
    desc: "Guided meditation sessions that help patients relax, reduce anxiety, and focus better.",
  },
  {
    icon: Brain,
    title: "Brain Boosters",
    desc: "Games like Tic-Tac-Toe with a leaderboard to enhance mental agility in a fun way.",
  },
]

.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className={`p-8 bg-white dark:bg-gray-700 shadow-lg rounded-xl text-center
                  hover:shadow-2xl transition transform hover:-translate-y-2 cursor-pointer
                  hover:scale-105`}
                onClick={() => setPopupContent(title)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setPopupContent(title);
                }}
                aria-label={`Learn more about ${title}`}
              >
                <Icon className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-6" />
                <h4 className="text-2xl font-semibold mb-4">{title}</h4>
                <p className="text-gray-600 dark:text-gray-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctor Connect */}
      <section id="doctor" className="px-10 py-20 max-w-6xl mx-auto">
        <div
          className={`bg-emerald-50 dark:bg-gray-800 rounded-2xl shadow-lg p-10`}
        >
          <h3
            className={`text-4xl font-bold text-center mb-16
            ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}
          >
            Doctor Connect
          </h3>
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
{[
  {
    icon: Stethoscope,
    title: "24/7 Access",
    desc: "Reach certified doctors anytime, anywhere with one click.",
  },
  {
    icon: HeartPulse,
    title: "Emergency Help",
    desc: "Get immediate medical support in critical situations — day or night.",
  },
  {
    icon: Users2, // Replaces Brain icon
    title: "Expert Network",
    desc: "Access a wide pool of verified specialists across various domains.",
  },
  {
    icon: FileHeart,
    title: "Medical History",
    desc: "Secure access to your records — doctors see only what you approve.",
  },
  {
    icon: PhoneCall,
    title: "Direct Call",
    desc: "Quickly call your assigned doctor or emergency support line.",
  },
  {
    icon: MessageCircleHeart,
    title: "Private Messaging",
    desc: "Chat directly with healthcare professionals for fast, reliable help.",
  },
]
.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className={`p-8 bg-white dark:bg-gray-700 shadow-md rounded-xl text-center cursor-pointer
                  hover:shadow-xl transition transform hover:-translate-y-1 hover:scale-105`}
                onClick={() => setPopupContent(title)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setPopupContent(title);
                }}
                aria-label={`Learn more about ${title}`}
              >
                <Icon className="w-14 h-14 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">{title}</h4>
                <p className="text-gray-600 dark:text-gray-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    {/* App Preview Section */}
<section id="app-preview" className="px-10 py-20 max-w-6xl mx-auto">
  <div className={`bg-emerald-50 dark:bg-gray-800 rounded-2xl shadow-lg p-10`}>
    <h3 className={`text-4xl font-bold text-center mb-16 ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>
      App Preview
    </h3>

    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
      {[1, 2, 3].map((num) => (
        <img
          key={num}
          src={`/preview-${num}.jpg`}
          alt={`App Screenshot ${num}`}
          className="w-[300px] h-[300px] object-cover rounded-xl shadow-lg transform transition duration-300 ease-in-out hover:scale-105 hover:shadow-2xl cursor-pointer"
          loading="lazy"
          onClick={() => setSelectedImage(`/preview-${num}.jpg`)}
        />
      ))}
    </div>
  </div>

  {/* Modal for enlarged image */}
  {selectedImage && (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={() => setSelectedImage(null)}
    >
      <div
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside the image
      >
        <button
          className="absolute top-2 right-2 text-white text-2xl bg-black/50 rounded-full px-3 py-1 hover:bg-red-500 transition"
          onClick={() => setSelectedImage(null)}
          aria-label="Close preview"
        >
          &times;
        </button>
        <img
          src={selectedImage}
          alt="Enlarged Preview"
          className="w-full h-auto rounded-lg shadow-2xl transition-all duration-300"
        />
      </div>
    </div>
  )}
</section>


      {/* Popup Panel */}
      {popupContent && (
        <div
          className="fixed top-[69px] bottom-[60px] right-6 bg-white dark:bg-gray-800 p-5 w-80 rounded-lg shadow-xl border z-50 overflow-y-auto
            transition-transform duration-300 transform scale-100"
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-title"
        >
          <button
            className="absolute top-2 right-3 text-gray-500 dark:text-gray-400 hover:text-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
            onClick={() => setPopupContent(null)}
            aria-label="Close popup"
          >
            ✖
          </button>
          <h3
            id="popup-title"
            className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2"
          >
            {popupContent}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            More information about <strong>{popupContent}</strong> will be available soon.
          </p>
        </div>
      )}

      {/* Footer */}
      <footer
        className={`p-6 text-center space-y-2 transition-colors duration-700
          ${darkMode ? "bg-gray-900 text-gray-400" : "bg-emerald-700 text-white"}`}
      >
        <p>
          © {new Date().getFullYear()} Developer Team <span className="font-bold">BYTE-BY-BYTE</span>. All rights reserved.
        </p>
        <p>
          Contact Us: <span className="font-semibold">+91 93150 93867</span>
        </p>
        <p>
          Mail:{" "}
          <a
            href="mailto:NeuroAidSupport@gmail.com"
            className="underline hover:text-emerald-300"
          >
            NeuroAidSupport@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
