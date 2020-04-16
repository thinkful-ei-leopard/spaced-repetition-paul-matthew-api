const LinkedList = require('./LinkedList');

const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score'
      )
      .where('language.user_id', user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count'
      )
      .where({ language_id });
  },

  populate(db, language_id, word_id){
    return db.raw(`SELECT original, "next"
    FROM word w JOIN "language" l ON w.language_id = l.id
    where l.id = ${language_id}
    and w.id = ${word_id}`);
  },

  getTrans(db, language_id, word){
    return db.raw(`SELECT "translation"
    FROM word w JOIN "language" l ON w.language_id = l.id
    where l.id = ${language_id}
    and original = '${word}';`);
  },

  getValues(db, language_id, word){
    return db.raw(`SELECT memory_value, correct_count, incorrect_count, total_score
    FROM word w JOIN "language" l ON w.language_id = l.id
    where l.id = ${language_id}
    and original = '${word}';`);
  },

  setValues(db, language_id, word, values){
    db.raw(`BEGIN;
    UPDATE
      word
    SET
        memory_value = ${values.memory_value}, 
        correct_count = ${values.correct_count}, 
        incorrect_count = ${values.incorrect_count}
    WHERE
      language_id = ${language_id} and original = '${word}';
    
    UPDATE
      "language"
    SET
      total_score = ${values.total_score}
    WHERE
      id = ${language_id};
    
    COMMIT;`).then();
  },

  getWordID(db, language_id, word){
    return db.raw(`select id
    from word
    where original = '${word}'
    and language_id = ${language_id}`);
  },

  getNextID(db, language_id, word_id){
    return db.raw(`select "next"
    from word
    where id = ${word_id}
    and language_id = ${language_id}`);
  },

  setHead(db, id, head){
    db.raw(`update "language"
    set head = ${head}
    where id = ${id}`).then();
  },

  savePlacement(db, current_id, next_id, next_next){
    db.raw(`begin;
    UPDATE word 
    SET "next" = ${current_id}
    WHERE id = ${next_id};
    
    UPDATE word 
    SET "next" = ${next_next}
    WHERE id = ${current_id};
    
    commit;`).then();
  },
};

module.exports = LanguageService;
