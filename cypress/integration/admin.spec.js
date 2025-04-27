describe('Admin Dashboard - Login and Product Management', () => {
  it('allows admin to login and add a new product', () => {
    // Visit the admin page
    cy.visit('/admin');

    // Perform login
    cy.get('#username').type('admin');
    cy.get('#password').type('letmein123');
    cy.contains('Login').click();

    // Verify that the Products Management tab is visible
    cy.contains('Products Management').should('be.visible');

    // Open the Add New Product modal
    cy.contains('Add New Product').click();

    // Fill out the product form
    cy.get('#name').type('Test Cypress Product');
    cy.get('#price').clear().type('19.99');
    cy.get('#category').select('origami');
    cy.get('#badge').select('New');
    cy.get('#quantity').clear().type('5');
    cy.get('#description').type('Created by Cypress test');
    // Use image URL fallback
    cy.get('#image').type('http://example.com/test.png');

    // Submit the form
    cy.contains('Save Product').click();

    // Verify success message and new product appears in the list
    cy.contains('Product created successfully').should('be.visible');
    cy.contains('Test Cypress Product').should('be.visible');
  });
});