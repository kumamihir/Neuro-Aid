import { useState, useEffect } from "react";

type CardType = {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const cardValues = ["🍎", "🍌", "🍇", "🍊", "🍉", "🍒"];

export default function MemoryMatch() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [congrats, setCongrats] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...cardValues, ...cardValues]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlipped([]);
    setCongrats(false);
    setDisabled(false);
  };

  const handleFlip = (index: number) => {
    if (disabled) return;
    const newCards = [...cards];
    if (newCards[index].isFlipped || newCards[index].isMatched) return;

    newCards[index].isFlipped = true;
    setCards(newCards);

    if (flipped.length === 0) {
      setFlipped([index]);
    } else if (flipped.length === 1) {
      setFlipped([flipped[0], index]);
      setDisabled(true);

      setTimeout(() => {
        checkMatch(flipped[0], index);
      }, 800);
    }
  };

  const checkMatch = (firstIndex: number, secondIndex: number) => {
    const newCards = [...cards];
    if (newCards[firstIndex].value === newCards[secondIndex].value) {
      newCards[firstIndex].isMatched = true;
      newCards[secondIndex].isMatched = true;
    } else {
      newCards[firstIndex].isFlipped = false;
      newCards[secondIndex].isFlipped = false;
    }
    setCards(newCards);
    setFlipped([]);
    setDisabled(false);

    // ✅ Check if all cards are matched
    if (newCards.every((card) => card.isMatched)) {
      setCongrats(true);

      // Auto-reset game after 2 seconds
      setTimeout(() => {
        initializeGame();
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* 🎉 Congrats message */}
      {congrats && (
        <div className="mb-4 px-4 py-2 bg-yellow-200 text-yellow-800 font-bold rounded-lg shadow">
          🎉 Congratulations! You matched all cards!
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, index) => (
          <button
            key={card.id}
            onClick={() => handleFlip(index)}
            className={`w-16 h-16 flex items-center justify-center text-2xl rounded-lg shadow 
              ${card.isFlipped || card.isMatched ? "bg-blue-200" : "bg-gray-400"}`}
          >
            {card.isFlipped || card.isMatched ? card.value : "❓"}
          </button>
        ))}
      </div>
    </div>
  );
}
