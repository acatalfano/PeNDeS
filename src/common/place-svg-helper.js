define([], function () {
    //x
    const radius = 30;

    //const markCount = getAttribute('marks');

    // the length of a chord (parallel to a diameter line) 1/2-radius distance from the center
    // i.e. the length of the real estate available to the outer rows
    const pairedChordLength = (radius * 4 * Math.sqrt(2)) / 3;
    const outerChordLength = radius * Math.sqrt(3);

    //const twoRowOffset = ((4 * Math.sqrt(2)) / 3) * radius;

    //const horizontalOffset = (index, tokenRadius) => tokenRadius * (3 * index + 2);

    const buildThreeRows = (total) => {
        const firstRow = Math.floor(total / 3);
        const secondRow = Math.ceil(total / 3);
        const firstRowIsEven = firstRow % 2 === 0;
        const oddRow = firstRowIsEven ? secondRow : firstRow;
        const evenRow = firstRowIsEven ? firstRow : secondRow;

        const [middleRow, outerRow] = total % 2 === 0 ? [evenRow, oddRow] : [oddRow, evenRow];

        return [middleRow, outerRow];
    };

    const buildTwoRows = (total) => {
        const firstRow = Math.floor(total / 2);
        const secondRow = Math.ceil(total / 2);
        const largeRow = Math.max(firstRow, secondRow);
        const smallRow = Math.min(firstRow, secondRow);
        return [largeRow, smallRow];
    };

    // const getMarkRadius = (count, midAndOut, paired) => {
    //     if (count <= 2) {
    //         return getMarkRadiusForOneRow(count);
    //     } else if (count <= 4) {
    //         return getMarkRadiusForTwoRows(...paired);
    //     } else if (count <= 12) {
    //         return getMarkRadiusForThreeRows(...midAndOut);
    //     } else {
    //         return 0;
    //     }
    // };

    const getMarkRadiusForThreeRows = (innerCount, outerCount) => {
        const horizontalRealEstate = innerCount > outerCount ? 2 * radius : outerChordLength;
        const markRadius = horizontalRealEstate / (3 * Math.max(innerCount, outerCount) + 1);
        return markRadius;
    };

    const getMarkRadiusForTwoRows = (lower) => {
        return pairedChordLength / (3 * lower + 1);
    };

    const getMarkRadiusForOneRow = (count) => {
        return (2 * radius) / (3 * count + 1);
    };

    return function getMarkRadius(count) {
        if (count <= 2) {
            return getMarkRadiusForOneRow(count);
        } else if (count <= 4) {
            return getMarkRadiusForTwoRows(...buildTwoRows(count));
        } else if (count <= 12) {
            return getMarkRadiusForThreeRows(...buildThreeRows(count));
        } else {
            return 0;
        }
    };

    //const midAndOutRowLengths = buildThreeRows(markCount);
    //const pairedBottomAndTopRowLengths = buildTwoRows(markCount);

    //const markRadius = getMarkRadius(markCount, midAndOutRowLengths, pairedBottomAndTopRowLengths);

    //const [middleRow, outerRow] = midAndOutRowLengths;
    //const [lowerPairedRow, upperPairedRow] = pairedBottomAndTopRowLengths;

    // const findPadding = (middleRow, outerRow, markRadius) => {
    //     let middlePadding, outerPadding;
    //     if (middleRow === outerRow) {
    //         middlePadding = outerPadding = ((3 - Math.sqrt(3)) * markRadius) / 2;
    //     } else if (middleRow < outerRow) {
    //         middlePadding = markRadius + ((4 - Math.sqrt(3)) * markRadius) / 2;
    //         outerPadding = ((3 - Math.sqrt(3)) * markRadius) / 2;
    //     } else {
    //         middlePadding = 0;
    //         outerPadding = ((5 - Math.sqrt(3)) * markRadius) / 2;
    //     }

    //     return [middlePadding, outerPadding];
    // };

    // const findPairedPadding = (upperRow, lowerRow, markRadius) => {
    //     let upperPadding;
    //     const lowerPadding = ((3 - 2 * Math.sqrt(2)) * radius) / 3;
    //     if (upperRow === lowerRow) {
    //         upperPadding = lowerPadding;
    //     } else {
    //         upperPadding = lowerPadding + (markRadius * 3) / 2;
    //     }
    //     return [lowerPadding, upperPadding];
    // };

    // const [middlePadding, outerPadding] = findPadding(middleRow, outerRow, markRadius);

    // const [lowerPadding, upperPadding] = findPairedPadding(upperPairedRow, lowerPairedRow, markRadius);

    // const idPrefix = getGuid();

    // const id = (str) => `${idPrefix}-${str}`;
    // const ref = (str) => `#${id(str)}`;
});
