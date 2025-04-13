let ingredients = [];

function addIngredient() {
    const input = document.getElementById('ingredientInput');
    const ingredient = input.value.trim();

    if (ingredient) {
        ingredients.push(ingredient);
        input.value = '';
        renderIngredients();
    }
}

function removeIngredient(index) {
    ingredients.splice(index, 1);
    renderIngredients();
}

function renderIngredients() {
    const ingredientList = document.getElementById('ingredientList');
    ingredientList.innerHTML = '';

    ingredients.forEach((ingredient, index) => {
        const div = document.createElement('div');
        div.innerHTML = `
            <span>${ingredient}</span>
            <button onclick="removeIngredient(${index})">Eliminar</button>
        `;
        ingredientList.appendChild(div);
    });
}

async function generateRecipe() {
    const recipeOutput = document.getElementById('recipeOutput');
    const vegetariano = document.getElementById('vegetariano').checked;
    const vegano = document.getElementById('vegano').checked;
    const sinGluten = document.getElementById('sinGluten').checked;
    const sinLacteos = document.getElementById('sinLacteos').checked;
    const sinNueces = document.getElementById('sinNueces').checked;

    if (ingredients.length === 0) {
        recipeOutput.innerHTML = '<p>Por favor, añade al menos un ingrediente.</p>';
        return;
    }

    // Construir las restricciones dietéticas
    let restrictions = [];
    if (vegetariano) restrictions.push('vegetariano');
    if (vegano) restrictions.push('vegano');
    if (sinGluten) restrictions.push('sin gluten');
    if (sinLacteos) restrictions.push('sin lácteos');
    if (sinNueces) restrictions.push('sin nueces');

    // Crear el prompt para la IA
    const prompt = `Crea una receta de cocina española usando estos ingredientes: ${ingredients.join(', ')}. ${restrictions.length > 0 ? `Debe ser ${restrictions.join(' y ')}.` : ''} Proporciona el nombre de la receta, el tiempo de preparación, los ingredientes y los pasos en un formato simple. Ejemplo:
Nombre: Receta Ejemplo
Tiempo: 30 minutos
Ingredientes: ingrediente 1, ingrediente 2
Pasos: 1. Hacer esto. 2. Hacer aquello.`;

    // Mostrar un mensaje de carga
    recipeOutput.innerHTML = '<p>Generando receta, por favor espera...</p>';

    try {
        const API_KEY = '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';
        const response = await fetch('https://api-inference.huggingface.co/models/distilgpt2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_length: 300, // Reducimos el tamaño para modelos pequeños
                    temperature: 0.7,
                    top_p: 0.9,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en la API: ${response.status} - ${response.statusText}. Detalle: ${errorText}`);
        }

        const data = await response.json();

        if (data && data[0] && data[0].generated_text) {
            const generatedRecipe = data[0].generated_text.trim();
            const formattedRecipe = generatedRecipe
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/Nombre: (.*?)(<br>|<\/p>)/g, '<h3>$1</h3>')
                .replace(/Tiempo: (.*?)(<br>|<\/p>)/g, '<p><strong>Tiempo de Preparación:</strong> $1</p>')
                .replace(/Ingredientes: (.*?)(<br>|<\/p>)/g, '<h4>Ingredientes:</h4><ul><li>$1</li></ul>')
                .replace(/Pasos: (.*?)(<br>|<\/p>)/g, '</ul><h4>Instrucciones:</h4><ol><li>$1</li></ol>')
                .replace(/(\d+\.\s)/g, '</li><li>'); // Separa los pasos en elementos de lista

            recipeOutput.innerHTML = `<p>${formattedRecipe}</p>`;
        } else {
            recipeOutput.innerHTML = '<p>Lo siento, no se pudo generar la receta. Es posible que la respuesta de la API no sea válida. Intenta de nuevo.</p>';
        }
    } catch (error) {
        console.error('Error al generar la receta:', error);
        recipeOutput.innerHTML = `<p>Hubo un error al generar la receta: ${error.message}. Por favor, intenta de nuevo más tarde.</p>`;
    }
}
