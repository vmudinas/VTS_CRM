using NBitcoin;
using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore; // Required for Entity Framework Core operations
using Newtonsoft.Json.Linq; // Required for parsing BlockCypher API response
using System.Text.Json; // Required for System.Text.Json

namespace FAI.API.Services.Bitcoin
{
    public class BitcoinWalletService
    {
        private readonly Network _network;
        private readonly ExtKey _masterKey; // Store the master key securely
        private readonly HttpClient _httpClient;
        private readonly Data.FAIContext _context;
        private readonly string _blockCypherApiUrl; // Base URL for BlockCypher API

        public BitcoinWalletService(string seedPhrase, Network network, HttpClient httpClient, Data.FAIContext context)
        {
            _network = network;
            _httpClient = httpClient;
            _context = context;
            _blockCypherApiUrl = "https://api.blockcypher.com/v1/btc/main"; // Use "btc/test3" for testnet

            // Load the seed phrase securely from an environment variable.
            string seedPhraseFromEnv = Environment.GetEnvironmentVariable("BITCOIN_SEED_PHRASE");

            if (string.IsNullOrEmpty(seedPhraseFromEnv))
            {
                throw new ArgumentNullException("BITCOIN_SEED_PHRASE environment variable is not set.");
            }

            Mnemonic mnemonic = new Mnemonic(seedPhraseFromEnv, Wordlist.English);
            _masterKey = mnemonic.DeriveExtKey();
        }

        /// <summary>
        /// Generates a new Bitcoin address for a given order index.
        /// </summary>
        /// <param name="orderIndex">A unique index for the order (e.g., order ID).</param>
        /// <returns>A new Bitcoin address.</returns>
        public string GenerateNewAddress(int orderIndex)
        {
            // Derive a unique key for each order using the order index
            // Using a derivation path like m/0'/0'/orderIndex'
            // This is a simplified example, a more robust path might be needed
            ExtKey orderKey = _masterKey.Derive(0, hardened: true).Derive(0, hardened: true).Derive((int)orderIndex, hardened: true);

            // Get the receiving address (external chain)
            BitcoinAddress address = orderKey.Neuter().PubKey.GetAddress(ScriptPubKeyType.Legacy, _network);

            return address.ToString();
        }

        /// <summary>
        /// Placeholder for starting the blockchain monitoring process.
        /// In a real application, this would likely be a background service.
        /// </summary>
        public void StartMonitoring()
        {
            Console.WriteLine("Bitcoin monitoring started (placeholder).");
            // TODO: Implement actual monitoring logic
        }


        /// <summary>
        /// Sends a webhook notification to the API upon payment confirmation or discrepancy.
        /// </summary>
        /// <param name="orderId">The ID of the order.</param>
        /// <param name="transactionId">The ID of a relevant Bitcoin transaction (e.g., the first confirmed one).</param>
        /// <param name="amount">The total amount of Bitcoin received for the order address.</param>
        /// <param name="confirmations">The number of confirmations for the relevant transaction.</param>
        /// <returns>A task representing the asynchronous operation.</returns>
        private async Task NotifyApiPaymentConfirmed(int orderId, string transactionId, decimal amount, int confirmations)
        {
            Console.WriteLine($"Notifying API of payment status for Order ID: {orderId}...");
            // TODO: Replace with actual API webhook endpoint and payload
            // The webhook should receive the order ID, the total received amount, and the current status ("BitcoinPaid", "underpaid", "overpaid")
            var webhookUrl = "YOUR_API_WEBHOOK_ENDPOINT"; // This should be loaded from configuration
            // You might want to fetch the updated order status from the database here
            var updatedOrder = await _context.Orders.FindAsync(orderId);
            if (updatedOrder == null)
            {
                Console.WriteLine($"Error: Could not find Order ID {orderId} to send webhook notification.");
                return;
            }

            var payload = new
            {
                orderId = orderId,
                status = updatedOrder.Status, // Send the updated status
                receivedAmount = amount, // Send the total received amount
                transactionId = transactionId, // Send a relevant transaction ID
                confirmations = confirmations // Send confirmations of the relevant transaction
            };

            try
            {
                var jsonPayload = System.Text.Json.JsonSerializer.Serialize(payload);
                var content = new StringContent(jsonPayload, System.Text.Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(webhookUrl, content);

                if (response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Webhook notification successful for Order ID: {orderId}");
                }
                else
                {
                    Console.WriteLine($"Webhook notification failed for Order ID: {orderId}. Status Code: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending webhook notification for Order ID: {orderId}: {ex.Message}");
            }
        }
    }
}
