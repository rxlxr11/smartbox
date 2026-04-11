import {todoApi} from "@/api/todo/todo";
import {gameApi} from "@/api/game/game";

export const API = {
    todo: { ...todoApi },
    game: { ...gameApi },
}