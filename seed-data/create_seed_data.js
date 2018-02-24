import createEntryTable from './generators/entryTableGenerator';
import createNoteTable from './generators/noteTableGenerator';
import createNoteTypeTable from './generators/noteTypeTableGenerator';

const entryIds = createEntryTable();
createNoteTable(entryIds);
createNoteTypeTable();
