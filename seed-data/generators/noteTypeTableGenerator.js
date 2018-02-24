import jsonfile from 'jsonfile';
import faker from 'faker';
import { systemNoteTypes } from './const';

const createNoteType = ({ id, name }) => ({
  id,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  name,
  user: 'system-user-id',
});

export default () => {
  const data = systemNoteTypes.map(createNoteType);

  const FILE_NAME = 'noteType.json';
  jsonfile.writeFile(FILE_NAME, data, err => {
    console.error(err);
  });
  return data.map(elem => elem.id);
};
