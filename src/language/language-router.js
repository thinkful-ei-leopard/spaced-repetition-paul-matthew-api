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
        error: "You don't have any languages",
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
  console.log(req.language);
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
      error: "Missing 'guess' in request body",
    });
  }

  try {
    const words = await LanguageService.getLanguageWords(
      req.app.get('db'),
      req.language.id
    );

    let SLL = await LanguageService.createLinkedList(req.language, words);

    const answer = SLL.head.value.translation.toLowerCase();
    let isCorrect;
    if (guess.toLowerCase() === answer) {
      isCorrect = true;
      SLL.head.value.memory_value *= 2;
      SLL.head.value.correct_count++;
      SLL.total_score++;
    } else {
      isCorrect = false;
      SLL.head.value.memory_value = 1;
      SLL.head.value.incorrect_count++;
    }

    const relocateWords = await SLL.relocateHead(SLL.head.value.memory_value);

    await LanguageService.updateHead(
      req.app.get('db'),
      req.language.id,
      SLL.head.id
    );
    await LanguageService.updateTotalScore(req.app.get('db'), SLL);
    await LanguageService.updateWords(req.app.get('db'), relocateWords);

    return res.status(200).json({
      nextWord: SLL.head.value.original,
      wordCorrectCount: SLL.head.value.correct_count,
      wordIncorrectCount: SLL.head.value.incorrect_count,
      totalScore: SLL.total_score,
      answer,
      isCorrect,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = languageRouter;
