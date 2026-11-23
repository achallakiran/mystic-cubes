// Sayings catalogue. trad: jp = Japanese, pali = Pali / Buddhist, cn = Chinese. tier: 1 Seed, 2 Path, 3 Peak.
// Renderings are plain-English and kept short; attribution says "after ..." where the wording is ours.
(function (root) {
  var S = [
    { id: 's01', tier: 1, trad: 'jp',   text: 'Fall seven times, stand up eight.', by: 'Japanese proverb' },
    { id: 's02', tier: 1, trad: 'jp',   text: 'Even monkeys fall from trees.', by: 'Japanese proverb' },
    { id: 's03', tier: 1, trad: 'pali', text: 'Drop by drop the jar is filled.', by: 'after the Dhammapada' },
    { id: 's04', tier: 1, trad: 'pali', text: 'Mind comes before all things.', by: 'after the Dhammapada' },
    { id: 's05', tier: 1, trad: 'cn',   text: 'The highest good is like water.', by: 'Laozi, Tao Te Ching' },
    { id: 's06', tier: 1, trad: 'jp',   text: 'One time, one meeting.', by: 'Tea saying, ichigo ichie' },
    { id: 's07', tier: 1, trad: 'jp',   text: 'Chop wood, carry water.', by: 'Zen saying' },
    { id: 's08', tier: 1, trad: 'pali', text: 'Health is the best gift.', by: 'after the Dhammapada' },
    { id: 's09', tier: 1, trad: 'pali', text: 'Hatred ends through love.', by: 'after the Dhammapada' },
    { id: 's10', tier: 1, trad: 'jp',   text: 'To study the Way is to study the self.', by: 'Dōgen' },

    { id: 'p01', tier: 2, trad: 'cn',   text: 'A journey of a thousand miles begins with a single step.', by: 'Laozi, Tao Te Ching' },
    { id: 'p02', tier: 2, trad: 'jp',   text: 'An old pond; a frog leaps in, the sound of water.', by: 'Matsuo Bashō, haiku' },
    { id: 'p03', tier: 2, trad: 'cn',   text: 'Knowing yourself is true wisdom.', by: 'after Laozi' },
    { id: 'p04', tier: 2, trad: 'jp',   text: 'In this world we walk on the roof of hell, gazing at flowers.', by: 'Kobayashi Issa, haiku' },
    { id: 'p05', tier: 2, trad: 'pali', text: 'Fine words without deeds are scentless flowers.', by: 'after the Dhammapada' },
    { id: 'p06', tier: 2, trad: 'pali', text: 'As a mother protects her only child, so cultivate a boundless heart.', by: 'after the Metta Sutta' },
    { id: 'p07', tier: 2, trad: 'cn',   text: 'Let muddy water be still, and it will clear.', by: 'after Laozi' },
    { id: 'p08', tier: 2, trad: 'jp',   text: 'A frog in a well does not know the great ocean.', by: 'Japanese proverb' },
    { id: 'p09', tier: 2, trad: 'jp',   text: 'One kind word can warm three winter months.', by: 'Japanese proverb' },
    { id: 'p10', tier: 2, trad: 'cn',   text: 'Do not do to others what you would not want done to yourself.', by: 'Confucius, Analects' },
    { id: 'p11', tier: 2, trad: 'cn',   text: 'Constant dripping wears away stone.', by: 'Chinese proverb' },
    { id: 'p12', tier: 2, trad: 'cn',   text: 'The soft overcomes the hard, the gentle overcomes the strong.', by: 'Laozi, Tao Te Ching' },

    { id: 'k01', tier: 3, trad: 'pali', text: 'You yourself must make the effort; the Buddhas only point the way.', by: 'after the Dhammapada' },
    { id: 'k02', tier: 3, trad: 'cn',   text: 'Learning without thinking is useless; thinking without learning is dangerous.', by: 'Confucius, Analects' },
    { id: 'k03', tier: 3, trad: 'pali', text: 'Drop by drop the water jar is filled; so the wise are filled with good, little by little.', by: 'after the Dhammapada' },
    { id: 'k04', tier: 3, trad: 'pali', text: 'Though one conquer a thousand men in battle, the greatest victor is he who conquers himself.', by: 'after the Dhammapada' },
    { id: 'k05', tier: 3, trad: 'jp',   text: 'Before enlightenment, chop wood, carry water. After enlightenment, chop wood, carry water.', by: 'Zen saying' },
    { id: 'k06', tier: 3, trad: 'cn',   text: 'To know what you know and what you do not know, that is true knowledge.', by: 'Confucius, Analects' },
    { id: 'k07', tier: 3, trad: 'pali', text: 'As rain does not break through a well thatched house, passion does not break through a trained mind.', by: 'after the Dhammapada' },
    { id: 'k08', tier: 3, trad: 'cn',   text: 'Learn as if you could not reach your goal, and as if you were afraid of losing it.', by: 'Confucius, Analects' },
    { id: 'k09', tier: 3, trad: 'pali', text: 'Better than a thousand empty words is one word that brings peace.', by: 'after the Dhammapada' }
  ];
  if (typeof module !== 'undefined' && module.exports) module.exports = { SAYINGS: S };
  else root.SAYINGS = S;
})(typeof window !== 'undefined' ? window : this);
