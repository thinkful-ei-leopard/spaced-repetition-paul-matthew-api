/* eslint-disable eqeqeq */
/* eslint-disable no-prototype-builtins */
const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');

const LinkedList = require('./LinkedList');

const bodyParser = express.json();

const languageRouter = express.Router();

languageRouter.use(requireAuth).use(async (req, res, next) => {
  try {
    const language = await LanguageService.getUsersLanguage(
      req.app.get('db'),
      req.user.id
    );

    if (!language)
      return res.status(404).json({
        error: 'You don\'t have any languages',
      });

    req.language = language;
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/', async (req, res, next) => {
  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    res.json({
      language: req.language,
      words,
    });
    next();
  } catch (error) {
    next(error);
  }
});

languageRouter.get('/head', async (req, res, next) => {
  LanguageService.getLanguageHead(req.app.get('db'), req.language.head)
    .then((nextHead) => {
      const {
        correct_count,
        incorrect_count,
        original,
        total_score,
      } = nextHead.rows[0];
      const output = {
        nextWord: original,
        totalScore: total_score,
        wordCorrectCount: correct_count,
        wordIncorrectCount: incorrect_count,
      };
      res.json(output);
    })
    .catch(next);
});

languageRouter.post('/guess', bodyParser, async (req, res, next) => {
  const { guess } = req.body;

  if (!guess) {
    return res.status(400).json({
      error: 'Missing \'guess\' in request body',
    });
  }

  try {
    let list = new LinkedList();
    let word = await LanguageService.populate(
      req.app.get('db'),
      req.language.id, 
      req.language.head
    );
    while(word.rows[0].next != null) {
      list.insertLast(word.rows[0].original);
      word = await LanguageService.populate(
        req.app.get('db'), 
        req.language.id, 
        word.rows[0].next
      );
    }
    list.insertLast(word.rows[0].original);
    list.insertLast(word.rows[0].insertLast);

    let answer = await LanguageService.getTrans(req.app.get('db'), req.language.id, list.head.value);
    answer = answer.rows[0].translation.trim();
    answer = answer.toLowerCase();

    const values = await LanguageService.getValues(req.app.get('db'), req.language.id, list.head.value);
    let { memory_value, correct_count, incorrect_count, total_score } = values.rows[0];
    let isCorrect;

    if(guess === answer){
      isCorrect = true;
      memory_value *= 2;
      correct_count += 1;
      total_score += 1;
    }
    else {
      isCorrect = false;
      memory_value = 1;
      incorrect_count += 1;
    }

    //save the new values to the word in the database
    const newValues = {
      memory_value, 
      correct_count, 
      incorrect_count, 
      total_score
    };
    LanguageService.setValues(req.app.get('db'), req.language.id, list.head.value, newValues);

    //remove the current word and place it however many steps back
    let temp = list.head.value;
    list.remove(list.head.value);
    list.insertAt(temp, memory_value+1);

    //get next word and its values for correct and incorrect
    const nextValues = await LanguageService.getValues(req.app.get('db'), req.language.id, list.head.value);
    correct_count = nextValues.rows[0].correct_count;
    incorrect_count = nextValues.rows[0].incorrect_count;

    //save the order of the linked list to the database
    const headID = await LanguageService.getWordID(req.app.get('db'), req.language.id, list.head.value);
    LanguageService.setHead(req.app.get('db'), req.language.id, headID.rows[0].id);
    const current_ID = await LanguageService.getWordID(req.app.get('db'), req.language.id, temp);
    const next_next = await LanguageService.getNextID(req.app.get('db'), req.language.id, current_ID.rows[0].id+memory_value);
    LanguageService.savePlacement(req.app.get('db'), current_ID.rows[0].id, current_ID.rows[0].id+memory_value, next_next.rows[0].next);

    //send back the required fields
    const output = {
      nextWord: list.head.value,
      wordCorrectCount: correct_count,
      wordIncorrectCount: incorrect_count,
      totalScore: total_score,
      answer,
      isCorrect,
    };
    res.json(output);
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
