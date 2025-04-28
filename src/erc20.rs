//! Implementation of the ERC-20 standard
//!
//! The eponymous [`Erc20`] type provides all the standard methods,
//! and is intended to be inherited by other contract types.
//!
//! Note that this code is unaudited and not fit for production use.

use alloc::string::String;
use alloy_primitives::{Address, U256, Uint};
use alloy_sol_types::sol;
use stylus_sdk::{
    evm,
    msg,
    prelude::*,
};
use stylus_sdk::storage::StorageString;
sol_storage! {
    /// Erc20 implements all ERC-20 methods.
    pub struct Erc20 {
        /// Maps users to balances
        mapping(address => uint256) balances;
        /// Maps users to a mapping of each spender's allowance
        mapping(address => mapping(address => uint256)) allowances;
        /// The total supply of the token
        uint256 total_supply;
        /// Token name
        string name;
        /// Token symbol
        string symbol;
        /// Token decimals
        uint8 decimals;
    }
}

// Declare events and Solidity error types
sol! {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InsufficientBalance(address from, uint256 have, uint256 want);
    error InsufficientAllowance(address owner, address spender, uint256 have, uint256 want);
}

/// Represents the ways methods may fail.
#[derive(SolidityError)]
pub enum Erc20Error {
    InsufficientBalance(InsufficientBalance),
    InsufficientAllowance(InsufficientAllowance),
}

// These methods aren't exposed to other contracts
impl Erc20 {
    /// Initialize token parameters
    pub fn initialize(&mut self, name: String, symbol: String, decimals: u8) {
        self.name.set_str(&name);
        self.symbol.set_str(&symbol);
        self.decimals.set(Uint::from(decimals));
    }

    /// Movement of funds between two accounts
    pub fn _transfer(
        &mut self,
        from: Address,
        to: Address,
        value: U256,
    ) -> Result<(), Erc20Error> {
        let mut sender_balance = self.balances.setter(from);
        let old_sender_balance = sender_balance.get();
        if old_sender_balance < value {
            return Err(Erc20Error::InsufficientBalance(InsufficientBalance {
                from,
                have: old_sender_balance,
                want: value,
            }));
        }
        sender_balance.set(old_sender_balance - value);

        let mut to_balance = self.balances.setter(to);
        let new_to_balance = to_balance.get() + value;
        to_balance.set(new_to_balance);

        evm::log(Transfer { from, to, value });
        Ok(())
    }

    /// Mints `value` tokens to `address`
    pub fn mint(&mut self, address: Address, value: U256) -> Result<(), Erc20Error> {
        // Get current balance first
        let current_balance = self.balances.get(address);
        // Then update it
        self.balances.setter(address).set(current_balance + value);

        // Get current supply first
        let current_supply = self.total_supply.get();
        // Then update it
        self.total_supply.set(current_supply + value);

        evm::log(Transfer {
            from: Address::ZERO,
            to: address,
            value,
        });

        Ok(())
    }

    /// Burns `value` tokens from `address`
    pub fn burn(&mut self, address: Address, value: U256) -> Result<(), Erc20Error> {
        // Get current balance first
        let current_balance = self.balances.get(address);
        if current_balance < value {
            return Err(Erc20Error::InsufficientBalance(InsufficientBalance {
                from: address,
                have: current_balance,
                want: value,
            }));
        }
        // Then update it
        self.balances.setter(address).set(current_balance - value);

        // Get current supply first
        let current_supply = self.total_supply.get();
        // Then update it
        self.total_supply.set(current_supply - value);

        evm::log(Transfer {
            from: address,
            to: Address::ZERO,
            value,
        });

        Ok(())
    }
}

// These methods are external to other contracts
#[public]
impl Erc20 {
    pub fn name(&self) -> String {
        let bytes = self.read_storage_string(&self.name);
        String::from_utf8_lossy(&bytes).to_string()
    }

    pub fn symbol(&self) -> String {
        let bytes = self.read_storage_string(&self.symbol);
        String::from_utf8_lossy(&bytes).to_string()
    }

    /// Token decimals
    pub fn decimals(&self) -> u8 {
        self.decimals.get().to::<u8>()
    }

    pub fn total_supply(&self) -> U256 {
        self.total_supply.get()
    }

    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get(owner)
    }

    pub fn transfer(&mut self, to: Address, value: U256) -> Result<bool, Erc20Error> {
        self._transfer(msg::sender(), to, value)?;
        Ok(true)
    }

    pub fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        value: U256,
    ) -> Result<bool, Erc20Error> {
        let current_allowance = self.allowances.getter(from).get(msg::sender());
        if current_allowance < value {
            return Err(Erc20Error::InsufficientAllowance(InsufficientAllowance {
                owner: from,
                spender: msg::sender(),
                have: current_allowance,
                want: value,
            }));
        }

        // Update allowance
        self.allowances
            .setter(from)
            .setter(msg::sender())
            .set(current_allowance - value);

        self._transfer(from, to, value)?;
        Ok(true)
    }

    pub fn approve(&mut self, spender: Address, value: U256) -> bool {
        self.allowances.setter(msg::sender()).insert(spender, value);
        evm::log(Approval {
            owner: msg::sender(),
            spender,
            value,
        });
        true
    }

    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.getter(owner).get(spender)
    }
}

impl Erc20 {
    fn read_storage_string(&self, storage_string: &StorageString) -> Vec<u8> {
        let mut bytes = Vec::new();
        let mut index = 0;
        while let Some(byte) = storage_string.0.get(index) {
            bytes.push(byte);
            index += 1;
        }
        bytes
    }
}