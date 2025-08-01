import {flatNES} from "../allnes";
import {
    NES_mirror_ppu_Aonly, NES_mirror_ppu_Bonly,
    NES_mirror_ppu_four,
    NES_mirror_ppu_horizontal,
    NES_mirror_ppu_vertical,
    NES_PPU_mirror_modes
} from "../../nes/mappers/interface";

export function NROM_cycle(nes: flatNES, howmany: u32): void {}
export function NROM_a12_watch(nes: flatNES, addr: u32): void {}
export function NROM_CPU_read(nes: flatNES, addr: u32, val: u32): u32
{
    addr &= 0xFFFF;
    if (addr < 0x2000)
        return nes.mapper_CPU_RAM[addr & 0x7FF];
    if (addr < 0x3FFF)
        return nes.ppu_reg_read(addr, val);
    if (addr < 0x4020)
        return nes.cpu_reg_read(addr, val);
    if (addr >= 0x8000)
        return nes.mapper_PRG_ROM[(addr - 0x8000) % nes.mapper_PRG_ROM_size];
    return val;
}

export function NROM_CPU_write(nes: flatNES, addr: u32, val: u32): void {
    addr &= 0xFFFF;
    if (addr < 0x2000) {
        nes.mapper_CPU_RAM[addr & 0x7FF] = <u8>val;
        return;
    }
    if (addr < 0x3FFF) {
        nes.ppu_reg_write(addr, val);
        return;
    }
    if (addr < 0x4020) {
        nes.cpu_reg_write(addr, val);
        return;
    }
}

export function NROM_PPU_read(nes: flatNES, addr: u32): u32 {
    if (addr < 0x2000)
        return nes.mapper_CHR_ROM[addr];
    return nes.mapper_CIRAM[nes.mirror_ppu_addr(addr)];
}

export function NROM_PPU_write(nes: flatNES, addr: u32, val: u32): void {
    if (addr < 0x2000) return;
    nes.mapper_CIRAM[nes.mirror_ppu_addr(addr)] = <u8>val;
}

export function NROM_reset(nes: flatNES): void {}

function NROM_set_mirroring(nes: flatNES): void {
    switch (nes.mapper_ppu_mirror) {
        case NES_PPU_mirror_modes.Vertical:
            nes.mirror_ppu_addr = NES_mirror_ppu_vertical;
            return;
        case NES_PPU_mirror_modes.Horizontal:
            nes.mirror_ppu_addr = NES_mirror_ppu_horizontal;
            return;
        case NES_PPU_mirror_modes.FourWay:
            nes.mirror_ppu_addr = NES_mirror_ppu_four;
            return;
        case NES_PPU_mirror_modes.ScreenAOnly:
            nes.mirror_ppu_addr = NES_mirror_ppu_Aonly;
            return;
        case NES_PPU_mirror_modes.ScreenBOnly:
            nes.mirror_ppu_addr = NES_mirror_ppu_Bonly;
            return;
    }
}

export function NROM_set_cart(nes: flatNES): void {
    for (let i = 0; i < 0x2000; i++) {
        nes.mapper_CHR_ROM[i] = nes.cart_CHR_ROM[i];
    }
    nes.mapper_PRG_ROM = new StaticArray<u8>(nes.cart_PRG_ROM.byteLength);
    for (let i = 0, k = nes.cart_PRG_ROM.byteLength; i < k; i++) {
        nes.mapper_PRG_ROM[i] = nes.cart_PRG_ROM[i];
    }
    nes.mapper_PRG_ROM_size = nes.cart_header_prg_rom_size;

    nes.mapper_ppu_mirror = nes.cart_header_mirroring;
    NROM_set_mirroring(nes);
}