import {GB_cart} from "../gb_cart";

export interface GB_mapper {
    reset(): void;

    CPU_read(addr: u32, val: u32): u32;
    CPU_write(addr: u32, val: u32): void;

    PPU_read(addr: u32): u32;

    set_cart(cart: GB_cart, BIOS: Uint8Array): void;
}