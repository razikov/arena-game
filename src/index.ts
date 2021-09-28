import testRun from './diceGame/engine';

let i = 0;
const firstChangeHero = {
    id: 1,
    name: "hero1",
    avatarUrl: "",
    attackDice: 2,
    defenceDice: 3,
    speedDice: 3,
};
const secondChangeHero = {
    id: 2,
    name: "hero2",
    avatarUrl: "",
    attackDice: 3,
    defenceDice: 2,
    speedDice: 3,
};

testRun(false, firstChangeHero, false, secondChangeHero);
console.log("ok");