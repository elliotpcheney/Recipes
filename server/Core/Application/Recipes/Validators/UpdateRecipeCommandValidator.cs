﻿using FluentValidation;
using Recipes.Core.Application.Recipes.Commands;

namespace Recipes.Core.Application.Recipes.Validators
{
    public class UpdateRecipeCommandValidator : AbstractValidator<UpdateRecipeCommand>
    {
        public UpdateRecipeCommandValidator()
        {
            RuleFor(x => x.Id).NotEmpty();
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x.CookTime).NotNull().GreaterThan(0);
            RuleFor(x => x.PrepTime).NotNull().GreaterThan(0);
            RuleFor(x => x.Ingredients.Count).GreaterThan(0);
            RuleFor(x => x.Instructions.Count).GreaterThan(0);
            RuleForEach(x => x.Ingredients).NotNull().SetValidator(new IngredientRequestValidator());
            RuleForEach(x => x.Instructions).NotNull().SetValidator(new InstructionRequestValidator());
            RuleFor(x => x.Image).SetValidator(new ImageRequestValidator());
        }
    }
}