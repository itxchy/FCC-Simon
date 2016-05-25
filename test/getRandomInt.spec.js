describe('getRandomInt()', function() {
	function isNumeric(n) {
  	return !isNaN(parseFloat(n)) && isFinite(n);
	}

	var getRandomInt = simon.getRandomInt;
	var isNumber = getRandomInt(1, 4);

	it('should be a number', function () {
		expect(isNumeric(isNumber)).toBe(true);
	})

});