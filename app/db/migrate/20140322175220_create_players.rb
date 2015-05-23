class CreatePlayers < ActiveRecord::Migration
  def change
    create_table :players do |t|
      t.string :phone
      t.boolean :male

      t.timestamps
    end
  end
end
