import jsonfile from 'jsonfile';
import faker from 'faker';
import uuid from 'uuid';
import { roles, champions } from './const';

const randomRole = () => faker.random.arrayElement(roles);
const randomChamp = () => faker.random.arrayElement(champions);

const createEntry = () => ({
  id: uuid.v4(),
  user: 'fake-user-id',
  assists: faker.random.number(10),
  champion: randomChamp(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  cs: [
    [5, faker.random.number(20)],
    [10, faker.random.number({ min: 20, max: 70 })],
    [15, faker.random.number({ min: 70, max: 120 })],
    [20, faker.random.number({ min: 120, max: 160 })],
  ],
  csPerMin: faker.random.number(9),
  deaths: faker.random.number(15),
  gameDate: faker.date.recent(),
  gameId: faker.random.number({ min: 2000, max: 3000 }),
  kills: faker.random.number(20),
  opponentChampion: randomChamp(),
  opponentPartner: randomChamp(),
  partner: randomChamp(),
  outcome: faker.random.boolean() ? 'W' : 'L',
  rank: 'Bronze 3',
  role: randomRole(),
  video: faker.internet.url(),
});

export default () => {
  const data = [];
  for (let i = 0; i < 3; i++) {
    data.push(createEntry());
  }

  const FILE_NAME = 'entry.json';

  jsonfile.writeFile(FILE_NAME, data, err => {
    console.error(err);
  });
  return data.map(elem => elem.id);
};
