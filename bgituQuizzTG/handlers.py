import logging
from aiogram import types, F
from aiogram.types import Message, CallbackQuery, FSInputFile
from aiogram.fsm.context import FSMContext
from aiogram.filters import Command, StateFilter
from aiogram.utils.keyboard import InlineKeyboardBuilder
from .admin_api import get_active_game
from .ml_api import is_swear, is_correct_open
from .states import QuizStates

def register_handlers(dp):
    async def process_step(message, state, steps, idx):
        if idx >= len(steps):
            await message.answer("Игра окончена! Спасибо за участие.")
            await state.clear()
            return
        step = steps[idx]
        step_type = step["type"]
        options = step.get("options", {})
        if step_type == "open":
            await message.answer(options.get("text", "Вопрос:"))
            await state.set_state(QuizStates.step)
        elif step_type == "choice":
            builder = InlineKeyboardBuilder()
            for opt in options.get("options", []):
                builder.button(text=opt, callback_data=opt)
            builder.adjust(1)
            await message.answer(options.get("text", "Вопрос:"), reply_markup=builder.as_markup())
            await state.set_state(QuizStates.step)
        elif step_type == "image":
            photo = FSInputFile(options.get("playerImg", "default.png"))
            await message.answer_photo(photo, caption=options.get("caption", "Посмотри на изображение"))
            await process_step(message, state, steps, idx + 1)
        elif step_type == "info":
            await message.answer(options.get("playerText", "Информация"))
            await process_step(message, state, steps, idx + 1)
        elif step_type == "feedback":
            await message.answer(options.get("playerText", "Оставь обратную связь"))
            await state.set_state(QuizStates.waiting_feedback)
        else:
            await process_step(message, state, steps, idx + 1)

    @dp.message(Command("start"))
    async def start_quiz(message: Message, state: FSMContext):
        game = get_active_game()
        steps = game["steps"]
        await state.update_data(steps=steps, step_idx=0, score=0)
        await process_step(message, state, steps, 0)

    @dp.message(StateFilter(QuizStates.step))
    async def handle_step(message: Message, state: FSMContext):
        data = await state.get_data()
        steps = data["steps"]
        idx = data["step_idx"]
        score = data["score"]
        step = steps[idx]
        step_type = step["type"]
        options = step.get("options", {})
        answer = message.text.strip()
        if is_swear(answer):
            await message.answer("Обнаружена ненормативная лексика. Вы исключены из квиза.")
            await state.clear()
            return
        if step_type == "open":
            reference = options.get("open_answer", "")
            if reference and is_correct_open(answer, reference):
                score += step.get("score", 50)
                await message.answer("Правильно! +баллы")
            else:
                await message.answer("Неправильно или нет ответа.")
            idx += 1
            await state.update_data(step_idx=idx, score=score)
            await process_step(message, state, steps, idx)
        elif step_type == "choice":
            correct = options.get("correct_answer", "")
            if answer == correct:
                score += step.get("score", 50)
                await message.answer("Правильно! +баллы")
            else:
                await message.answer("Неправильно.")
            idx += 1
            await state.update_data(step_idx=idx, score=score)
            await process_step(message, state, steps, idx)
        else:
            idx += 1
            await state.update_data(step_idx=idx, score=score)
            await process_step(message, state, steps, idx)

    @dp.callback_query(StateFilter(QuizStates.step))
    async def handle_choice(call: CallbackQuery, state: FSMContext):
        await handle_step(call.message, state)
        await call.answer()

    @dp.message(StateFilter(QuizStates.waiting_feedback))
    async def feedback(message: Message, state: FSMContext):
        if is_swear(message.text):
            await message.answer("Обнаружена ненормативная лексика. Вы исключены из квиза.")
            await state.clear()
            return
        await message.answer("Спасибо за игру!")
        await state.clear() 