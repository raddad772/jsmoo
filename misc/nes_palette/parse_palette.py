from struct import unpack_from


def main():
    out = 'const NES_palette = new Uint32Array(\n  '
    with open('ntscpalette.pal', 'rb') as infile:
        content = infile.read()

    color_bits = 0
    color_index = 0
    index = 0
    while color_bits < 8:
        # Needs to be written ABGR order
        r = unpack_from('B', content, index)[0]
        index += 1
        g = unpack_from('B', content, index)[0]
        index += 1
        b = unpack_from('B', content, index)[0]
        index += 1

        ocolor = 0xFF000000 | (b << 16) | (g << 8) | r

        out += hex(ocolor).upper() + ', '
        if ((index//3) & 15) == 0:
            if index ==1536: break
            out += '\n  '

        color_index += 1
        if color_index == 64:
            color_bits += 1
            color_index = 0
    out += '\n);'
    print(out)




if __name__ == '__main__':
    main()