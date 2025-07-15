class ReceptenboekApp {
    constructor() {
        this.categories = [];
        this.recipes = [];
        this.currentRecipe = null;
        this.editingRecipe = null;
        this.basePortions = 4;
        this.currentPortions = 4;
        
        this.initializeElements();
        this.bindEvents();
        this.loadData();
    }

    initializeElements() {
        // Main view elements
        this.categorySelect = document.getElementById('category-select');
        this.recipeSelect = document.getElementById('recipe-select');
        this.portionsInput = document.getElementById('portions');
        this.ingredientsList = document.getElementById('ingredients-list');
        this.preparationList = document.getElementById('preparation-list');
        
        // Buttons
        this.newRecipeBtn = document.getElementById('new-recipe-btn');
        this.editRecipeBtn = document.getElementById('edit-recipe-btn');
        this.deleteRecipeBtn = document.getElementById('delete-recipe-btn');
        
        // Form elements
        this.mainView = document.getElementById('main-view');
        this.recipeForm = document.getElementById('recipe-form');
        this.formTitle = document.getElementById('form-title');
        this.recipeFormElement = document.getElementById('recipe-form-element');
        this.closeFormBtn = document.getElementById('close-form-btn');
        this.cancelFormBtn = document.getElementById('cancel-form-btn');
        
        // Form fields
        this.recipeNameInput = document.getElementById('recipe-name');
        this.recipeCategorySelect = document.getElementById('recipe-category');
        this.recipePortionsInput = document.getElementById('recipe-portions');
        this.dishComponentsContainer = document.getElementById('dish-components');
        this.preparationStepsContainer = document.getElementById('preparation-steps');
        this.addComponentBtn = document.getElementById('add-component-btn');
        this.addStepBtn = document.getElementById('add-step-btn');
    }

    bindEvents() {
        // Main view events
        this.categorySelect.addEventListener('change', () => this.onCategoryChange());
        this.recipeSelect.addEventListener('change', () => this.onRecipeChange());
        this.portionsInput.addEventListener('input', () => this.onPortionsChange());
        
        // Button events
        this.newRecipeBtn.addEventListener('click', () => this.showNewRecipeForm());
        this.editRecipeBtn.addEventListener('click', () => this.showEditRecipeForm());
        this.deleteRecipeBtn.addEventListener('click', () => this.deleteRecipe());
        
        // Form events
        this.closeFormBtn.addEventListener('click', () => this.hideForm());
        this.cancelFormBtn.addEventListener('click', () => this.hideForm());
        this.recipeFormElement.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Close overlay when clicking outside
        this.recipeForm.addEventListener('click', (e) => {
            if (e.target === this.recipeForm) {
                this.hideForm();
            }
        });
        
        // Dynamic form events
        this.addComponentBtn.addEventListener('click', () => this.addDishComponent());
        this.addStepBtn.addEventListener('click', () => this.addPreparationStep());
    }

    async loadData() {
        try {
            await this.loadCategories();
            await this.loadRecipes();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showAlert('Fout bij het laden van gegevens', 'error');
        }
    }

    getAuthHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Try to get Home Assistant auth token
        if (window.hassConnection && window.hassConnection.auth) {
            headers['Authorization'] = `Bearer ${window.hassConnection.auth.accessToken}`;
        }
        
        return headers;
    }

    async loadCategories() {
        try {
            const response = await fetch('/api/receptenboek/api/categories', {
                headers: this.getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.categories = await response.json();
            this.populateCategorySelects();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadRecipes() {
        try {
            const response = await fetch('/api/receptenboek/api/recipes', {
                headers: this.getAuthHeaders()
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.recipes = await response.json();
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    }

    populateCategorySelects() {
        // Clear existing options
        this.categorySelect.innerHTML = '<option value="">Selecteer categorie...</option>';
        this.recipeCategorySelect.innerHTML = '<option value="">Selecteer categorie...</option>';
        
        // Add categories
        this.categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category.id;
            option1.textContent = category.name;
            this.categorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = category.id;
            option2.textContent = category.name;
            this.recipeCategorySelect.appendChild(option2);
        });
    }

    onCategoryChange() {
        const selectedCategory = this.categorySelect.value;
        
        // Clear recipe selection
        this.recipeSelect.innerHTML = '<option value="">Selecteer recept...</option>';
        this.recipeSelect.disabled = !selectedCategory;
        
        if (selectedCategory) {
            // Filter recipes by category
            const filteredRecipes = this.recipes.filter(recipe => 
                recipe.category === selectedCategory
            );
            
            filteredRecipes.forEach(recipe => {
                const option = document.createElement('option');
                option.value = recipe.id;
                option.textContent = recipe.name;
                this.recipeSelect.appendChild(option);
            });
        }
        
        // Clear current recipe display
        this.currentRecipe = null;
        this.updateRecipeDisplay();
        this.updateButtonStates();
    }

    onRecipeChange() {
        const selectedRecipeId = this.recipeSelect.value;
        
        if (selectedRecipeId) {
            this.currentRecipe = this.recipes.find(recipe => recipe.id === selectedRecipeId);
            this.basePortions = this.currentRecipe?.basePortions || 4;
            this.portionsInput.value = this.basePortions;
            this.currentPortions = this.basePortions;
        } else {
            this.currentRecipe = null;
        }
        
        this.updateRecipeDisplay();
        this.updateButtonStates();
    }

    onPortionsChange() {
        this.currentPortions = parseInt(this.portionsInput.value) || 1;
        this.updateIngredientsDisplay();
    }

    updateRecipeDisplay() {
        if (!this.currentRecipe) {
            this.ingredientsList.innerHTML = '<p class="empty-state">Selecteer een recept om ingrediënten te bekijken</p>';
            this.preparationList.innerHTML = '<p class="empty-state">Selecteer een recept om bereidingswijze te bekijken</p>';
            return;
        }
        
        this.updateIngredientsDisplay();
        this.updatePreparationDisplay();
    }

    updateIngredientsDisplay() {
        if (!this.currentRecipe) return;
        
        const portionMultiplier = this.currentPortions / this.basePortions;
        let html = '';
        
        this.currentRecipe.components.forEach(component => {
            if (component.ingredients && component.ingredients.length > 0) {
                html += `<div class="preparation-item">
                    <h4>${component.name}</h4>
                    <div class="ingredients">`;
                
                component.ingredients.forEach(ingredient => {
                    const adjustedAmount = (ingredient.amount * portionMultiplier).toFixed(1);
                    html += `<div class="ingredient-item">
                        <span class="ingredient-name">${ingredient.name}</span>
                        <span class="ingredient-amount">${adjustedAmount} ${ingredient.unit}</span>
                    </div>`;
                });
                
                html += `</div></div>`;
            }
        });
        
        this.ingredientsList.innerHTML = html || '<p class="empty-state">Geen ingrediënten gevonden</p>';
    }

    updatePreparationDisplay() {
        if (!this.currentRecipe) return;
        
        let html = '';
        
        this.currentRecipe.preparationSteps.forEach(step => {
            html += `<div class="preparation-item">
                <h4>${step.component}</h4>
                <ol>`;
            
            step.description.split('\n').forEach((line, index) => {
                if (line.trim()) {
                    html += `<li>${line.trim()}</li>`;
                }
            });
            
            html += `</ol></div>`;
        });
        
        this.preparationList.innerHTML = html || '<p class="empty-state">Geen bereidingswijze gevonden</p>';
    }

    updateButtonStates() {
        const hasSelectedRecipe = !!this.currentRecipe;
        this.editRecipeBtn.disabled = !hasSelectedRecipe;
        this.deleteRecipeBtn.disabled = !hasSelectedRecipe;
    }

    showNewRecipeForm() {
        this.editingRecipe = null;
        this.formTitle.textContent = 'Nieuw Recept';
        this.resetForm();
        this.showForm();
    }

    showEditRecipeForm() {
        if (!this.currentRecipe) return;
        
        this.editingRecipe = this.currentRecipe;
        this.formTitle.textContent = 'Recept Bewerken';
        this.populateForm(this.currentRecipe);
        this.showForm();
    }

    showForm() {
        this.mainView.classList.add('hidden');
        this.recipeForm.classList.remove('hidden');
    }

    hideForm() {
        this.recipeForm.classList.add('hidden');
        this.mainView.classList.remove('hidden');
    }

    resetForm() {
        this.recipeNameInput.value = '';
        this.recipeCategorySelect.value = '';
        this.recipePortionsInput.value = '4';
        
        // Reset dish components
        this.dishComponentsContainer.innerHTML = '';
        this.addDishComponent();
        
        // Reset preparation steps
        this.preparationStepsContainer.innerHTML = '';
        this.addPreparationStep();
    }

    populateForm(recipe) {
        this.recipeNameInput.value = recipe.name;
        this.recipeCategorySelect.value = recipe.category;
        this.recipePortionsInput.value = recipe.basePortions || 4;
        
        // Populate dish components
        this.dishComponentsContainer.innerHTML = '';
        recipe.components.forEach(component => {
            this.addDishComponent(component);
        });
        
        // Populate preparation steps
        this.preparationStepsContainer.innerHTML = '';
        recipe.preparationSteps.forEach(step => {
            this.addPreparationStep(step);
        });
    }

    addDishComponent(componentData = null) {
        const componentDiv = document.createElement('div');
        componentDiv.className = 'dish-component';
        
        componentDiv.innerHTML = `
            <div class="component-header">
                <input type="text" class="component-name" placeholder="Onderdeel naam (bijv. Taartbodem)" required value="${componentData?.name || ''}">
                <button type="button" class="btn btn-small btn-danger remove-component">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="ingredients-container">
                <h4>Ingrediënten</h4>
                <div class="ingredients"></div>
                <button type="button" class="btn btn-small btn-secondary add-ingredient">
                    <i class="fas fa-plus"></i> Ingrediënt toevoegen
                </button>
            </div>
        `;
        
        this.dishComponentsContainer.appendChild(componentDiv);
        
        // Bind events
        componentDiv.querySelector('.remove-component').addEventListener('click', () => {
            componentDiv.remove();
        });
        
        componentDiv.querySelector('.add-ingredient').addEventListener('click', () => {
            this.addIngredient(componentDiv.querySelector('.ingredients'));
        });
        
        // Add existing ingredients
        if (componentData?.ingredients) {
            const ingredientsContainer = componentDiv.querySelector('.ingredients');
            componentData.ingredients.forEach(ingredient => {
                this.addIngredient(ingredientsContainer, ingredient);
            });
        } else {
            // Add one empty ingredient
            this.addIngredient(componentDiv.querySelector('.ingredients'));
        }
    }

    addIngredient(container, ingredientData = null) {
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'ingredient';
        
        ingredientDiv.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="Ingrediënt naam" required value="${ingredientData?.name || ''}">
            <input type="number" class="ingredient-amount" placeholder="Hoeveelheid" step="0.1" min="0" required value="${ingredientData?.amount || ''}">
            <select class="ingredient-unit" required>
                <option value="">Eenheid</option>
                <option value="gram" ${ingredientData?.unit === 'gram' ? 'selected' : ''}>gram</option>
                <option value="kilogram" ${ingredientData?.unit === 'kilogram' ? 'selected' : ''}>kilogram</option>
                <option value="ml" ${ingredientData?.unit === 'ml' ? 'selected' : ''}>ml</option>
                <option value="liter" ${ingredientData?.unit === 'liter' ? 'selected' : ''}>liter</option>
                <option value="tl" ${ingredientData?.unit === 'tl' ? 'selected' : ''}>tl</option>
                <option value="el" ${ingredientData?.unit === 'el' ? 'selected' : ''}>el</option>
                <option value="stuk" ${ingredientData?.unit === 'stuk' ? 'selected' : ''}>stuk</option>
                <option value="cup" ${ingredientData?.unit === 'cup' ? 'selected' : ''}>cup</option>
                <option value="blik" ${ingredientData?.unit === 'blik' ? 'selected' : ''}>blik</option>
                <option value="pak" ${ingredientData?.unit === 'pak' ? 'selected' : ''}>pak</option>
                <option value="snuf" ${ingredientData?.unit === 'snuf' ? 'selected' : ''}>snuf</option>
            </select>
            <button type="button" class="btn btn-small btn-danger remove-ingredient">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(ingredientDiv);
        
        // Bind remove event
        ingredientDiv.querySelector('.remove-ingredient').addEventListener('click', () => {
            ingredientDiv.remove();
        });
    }

    addPreparationStep(stepData = null) {
        const stepDiv = document.createElement('div');
        stepDiv.className = 'preparation-step';
        
        stepDiv.innerHTML = `
            <input type="text" class="step-component" placeholder="Onderdeel naam" required value="${stepData?.component || ''}">
            <textarea class="step-description" placeholder="Beschrijving van de bereidingsstap" required>${stepData?.description || ''}</textarea>
            <button type="button" class="btn btn-small btn-danger remove-step">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        this.preparationStepsContainer.appendChild(stepDiv);
        
        // Bind remove event
        stepDiv.querySelector('.remove-step').addEventListener('click', () => {
            stepDiv.remove();
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.collectFormData();
        
        if (!this.validateFormData(formData)) {
            return;
        }
        
        try {
            let response;
            
            if (this.editingRecipe) {
                response = await fetch(`/api/receptenboek/api/recipes/${this.editingRecipe.id}`, {
                    method: 'PUT',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(formData),
                });
            } else {
                response = await fetch('/api/receptenboek/api/recipes', {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(formData),
                });
            }
            
            if (response.ok) {
                this.showAlert('Recept succesvol opgeslagen!', 'success');
                await this.loadRecipes();
                this.hideForm();
                
                // If editing, refresh the display
                if (this.editingRecipe) {
                    this.onRecipeChange();
                }
            } else {
                this.showAlert('Fout bij het opslaan van het recept', 'error');
            }
        } catch (error) {
            console.error('Error saving recipe:', error);
            this.showAlert('Fout bij het opslaan van het recept', 'error');
        }
    }

    collectFormData() {
        const formData = {
            name: this.recipeNameInput.value.trim(),
            category: this.recipeCategorySelect.value,
            components: [],
            preparationSteps: [],
            basePortions: parseInt(this.recipePortionsInput.value) || 4
        };
        
        // Collect dish components
        this.dishComponentsContainer.querySelectorAll('.dish-component').forEach(componentDiv => {
            const componentName = componentDiv.querySelector('.component-name').value.trim();
            const ingredients = [];
            
            componentDiv.querySelectorAll('.ingredient').forEach(ingredientDiv => {
                const name = ingredientDiv.querySelector('.ingredient-name').value.trim();
                const amount = parseFloat(ingredientDiv.querySelector('.ingredient-amount').value);
                const unit = ingredientDiv.querySelector('.ingredient-unit').value;
                
                if (name && amount && unit) {
                    ingredients.push({ name, amount, unit });
                }
            });
            
            if (componentName && ingredients.length > 0) {
                formData.components.push({
                    name: componentName,
                    ingredients: ingredients
                });
            }
        });
        
        // Collect preparation steps
        this.preparationStepsContainer.querySelectorAll('.preparation-step').forEach(stepDiv => {
            const component = stepDiv.querySelector('.step-component').value.trim();
            const description = stepDiv.querySelector('.step-description').value.trim();
            
            if (component && description) {
                formData.preparationSteps.push({
                    component: component,
                    description: description
                });
            }
        });
        
        return formData;
    }

    validateFormData(formData) {
        if (!formData.name) {
            this.showAlert('Receptnaam is verplicht', 'error');
            return false;
        }
        
        if (!formData.category) {
            this.showAlert('Categorie is verplicht', 'error');
            return false;
        }
        
        if (formData.components.length === 0) {
            this.showAlert('Voeg minimaal één onderdeel met ingrediënten toe', 'error');
            return false;
        }
        
        if (formData.preparationSteps.length === 0) {
            this.showAlert('Voeg minimaal één bereidingsstap toe', 'error');
            return false;
        }
        
        return true;
    }

    async deleteRecipe() {
        if (!this.currentRecipe) return;
        
        if (!confirm(`Weet je zeker dat je het recept "${this.currentRecipe.name}" wilt verwijderen?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/receptenboek/api/recipes/${this.currentRecipe.id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
            });
            
            if (response.ok) {
                this.showAlert('Recept succesvol verwijderd!', 'success');
                await this.loadRecipes();
                
                // Reset selections
                this.categorySelect.value = '';
                this.recipeSelect.innerHTML = '<option value="">Selecteer recept...</option>';
                this.recipeSelect.disabled = true;
                this.currentRecipe = null;
                this.updateRecipeDisplay();
                this.updateButtonStates();
            } else {
                this.showAlert('Fout bij het verwijderen van het recept', 'error');
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            this.showAlert('Fout bij het verwijderen van het recept', 'error');
        }
    }

    showAlert(message, type) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create new alert
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // Insert at the beginning of the container
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReceptenboekApp();
});
