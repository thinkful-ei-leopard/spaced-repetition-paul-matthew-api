/* eslint-disable eqeqeq */
/* eslint-disable no-prototype-builtins */
const express = require('express');
const LanguageService = require('./language-service');
const { requireAuth } = require('../middleware/jwt-auth');

const { LinkedList } = require('../linkedList');

const bodyParser = express.json();

const languageRouter = express.Router();

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
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

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
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

languageRouter
  .get('/head', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id
      );
      const firstWord = words[0];
      res.json({
        nextWord: firstWord.original,
        totalScore: req.language.total_score,
        wordCorrectCount: firstWord.correct_count,
        wordIncorrectCount: firstWord.incorrect_count
      });
      next();
    } catch (error) {
      next(error);
    }
  });

languageRouter
  .post('/guess', bodyParser, async (req, res, next) => {
    try {
      const { guess } = req.body;

      const linkedList = new LinkedList;

      const words = await LanguageService.populateLinkedList(
        req.app.get('db'),
        req.language.id,
        linkedList
      );

      let response = {
        nextWord: words[1].original,
        wordCorrectCount: words[1].correct_count,
        wordIncorrectCount: words[1].incorrect_count,
        totalScore: req.language.total_score,
        answer: words[0].translation,
        isCorrect: false
      };

      if(guess === '' || !(req.body.hasOwnProperty('guess'))) {
        return res.status(400).json({
          error: 'Missing \'guess\' in request body',
        });
      }

      if(guess == linkedList.head.value.translation) {
        linkedList.head.value.memory_value *= 2;

        linkedList.head.value.correct_count++;

        req.language.total_score += 1;

        response = {
          ...response,
          isCorrect: true
        };
      } else {
        linkedList.head.value.incorrect_count++;

        linkedList.head.value.memory_value = 1;

        response = {
          ...response,
          isCorrect: false
        };
      }

      let m = linkedList.head.value.memory_value;
      let temp = linkedList.head;

      while(temp.next !== null && m > 0) {
        let tOriginal = temp.value.original;
        let tTranslation = temp.value.translation;
        let tCorrectCount = temp.value.correct_count;
        let tIncorrectCount = temp.value.incorrect_count;
        let tm = temp.value.memory_value;

        temp.value.original = temp.next.value.original;
        temp.value.translation = temp.next.value.translation;
        temp.value.correct_count = temp.next.value.correct_count;
        temp.value.incorrect_count = temp.next.value.incorrect_count;
        temp.value.memory_value = temp.next.value.memory_value;

        temp.next.value.original = tOriginal;
        temp.next.value.translation = tTranslation;
        temp.next.value.correct_count = tCorrectCount;
        temp.next.value.incorrect_count = tIncorrectCount;
        temp.next.value.memory_value = tm;
        temp = temp.next;
        m--;
      }

      let arrTemp = linkedList.head;

      let linkArr = [];

      while(arrTemp) {
        linkArr.push(arrTemp.value);

        arrTemp = arrTemp.next;
      }

      LanguageService.insertNewLinkedList(
        req.app.get('db'), 
        linkArr
      );
      LanguageService.updateLanguageTotalScore(
        req.app.get('db'), 
        req.language
      );

      res.json(response);

      next();
    } catch (error) {
      next(error);
    }
  });

module.exports = languageRouter;
