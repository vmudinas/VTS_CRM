describe('Home page', () => {
  it('loads and displays welcome banner', () => {
    cy.visit('/');
    cy.contains('Welcome to').should('be.visible');
    cy.contains('Folds & Flavors').should('be.visible');
  });
});