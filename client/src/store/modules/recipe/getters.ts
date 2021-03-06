import { GetterTree } from "vuex";
import { RecipeState } from "./state";
import { RootState } from "@/store/state";
import { Recipe } from "@/models/RecipeModels";

export const getters: GetterTree<RecipeState, RootState> = {
	currentRecipeList(state): Array<Recipe> {
		return state.currentRecipeList ?? [];
	},
};
