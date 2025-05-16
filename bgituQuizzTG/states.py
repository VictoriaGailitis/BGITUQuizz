from aiogram.fsm.state import State, StatesGroup

class QuizStates(StatesGroup):
    step = State()
    waiting_feedback = State() 