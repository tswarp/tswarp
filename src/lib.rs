// Only run this as a WASM if the export-abi feature is not set.
#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

// Modules and imports
mod erc20;

use alloc::string::String;
use alloy_primitives::{Address, U256, U8};
use stylus_sdk::{
    msg,
    storage::{StorageString, StorageUint},
    prelude::*,
};
use crate::erc20::{Erc20, Erc20Error};

// Define the entrypoint as a Solidity storage object. The sol_storage! macro
// will generate Rust-equivalent structs with all fields mapped to Solidity-equivalent
// storage slots and types.
sol_storage! {
    #[entrypoint]
    struct StylusToken {
        #[borrow]
        Erc20 erc20; // Use a unit type `()` here since dynamic params are passed elsewhere
    }
}

#[public]
#[inherit(Erc20)]
impl StylusToken {
    /// Constructor to initialize the token
    pub fn constructor(
        &mut self,
        name: String,
        symbol: String,
        decimals: u8,
    ) {
        self.erc20.initialize(
            name,
            symbol,
            decimals
        );
    }
    /// Mints tokens
    pub fn mint(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(msg::sender(), value)?;
        Ok(())
    }

    /// Mints tokens to another address
    pub fn mint_to(&mut self, to: Address, value: U256) -> Result<(), Erc20Error> {
        self.erc20.mint(to, value)?;
        Ok(())
    }

    /// Burns tokens
    pub fn burn(&mut self, value: U256) -> Result<(), Erc20Error> {
        self.erc20.burn(msg::sender(), value)?;
        Ok(())
    }
}