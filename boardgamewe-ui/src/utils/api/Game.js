import Model from "./Model.js";
import axios from "axios";

/** Enum providing the game ranking methods */
export const GameRankingMethods = Object.freeze({
    WIN_LOSE: "WIN_LOSE",
    POINTS_LOWER_BETTER: "POINTS_LOWER_BETTER",
    POINTS_HIGHER_BETTER: "POINTS_HIGHER_BETTER"
});

export default class Game extends Model {
    /** @inheritdoc */
    static get className() {
        return "game";
    }

    /** @inheritdoc */
    _initProperties() {
        super._initProperties();

        this.id_event = null;
        this.id_board_game = null;
        this.duration = null;
        this.ranking_method = null;

        this.board_game = null;
        this.players = []; // for creation, {Array<{user: Number, score: Number}>}
    }

    static async fetchAllInEvent(idEvent) {
        if(idEvent == null) {
            throw new Error("Cannot fetch games of an event with no ID.");
        }
        let {data} = await axios.get(`event/${idEvent}/games`);

        let processedCollection = [];
        data.forEach(elem => {
            let model = new this(elem);
            processedCollection.push(model);
        });

        return processedCollection;
    }
}