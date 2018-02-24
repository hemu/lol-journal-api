import jsonfile from 'jsonfile';
import faker from 'faker';
import uuid from 'uuid';
import { systemNoteTypes } from './const';

const randomNoteType = () => faker.random.arrayElement(systemNoteTypes).id;

const createNoteWithEntry = entryId => ({
  id: uuid.v4(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  entry: entryId,
  user: 'fake-user-id',
  marked: faker.random.number({ min: 0, max: 1 }),
  text: faker.lorem.sentence(),
  type: randomNoteType(),
});

const createNote = entryIds =>
  createNoteWithEntry(faker.random.arrayElement(entryIds));

export default entryIds => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push(createNote(entryIds));
  }

  const FILE_NAME = 'note.json';
  jsonfile.writeFile(FILE_NAME, data, err => {
    console.error(err);
  });
  return data.map(elem => elem.id);
};
